<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryActionController extends Controller
{
    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => ['required', 'string', 'max:80', 'unique:products,sku'],
            'barcode' => ['nullable', 'string', 'max:120', 'unique:products,barcode'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'preferred_supplier_id' => ['nullable', 'exists:suppliers,id'],
            'unit_of_measure' => ['required', 'string', 'max:40'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'reorder_point' => ['required', 'numeric', 'min:0'],
            'reorder_quantity' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'location_id' => ['required', 'exists:locations,id'],
            'opening_quantity' => ['required', 'numeric', 'min:0'],
        ]);

        $product = DB::transaction(function () use ($validated): Product {
            $product = Product::create([
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'name' => $validated['name'],
                'category_id' => $validated['category_id'] ?? null,
                'preferred_supplier_id' => $validated['preferred_supplier_id'] ?? null,
                'unit_of_measure' => $validated['unit_of_measure'],
                'cost_price' => $validated['cost_price'],
                'sale_price' => $validated['sale_price'],
                'reorder_point' => $validated['reorder_point'],
                'reorder_quantity' => $validated['reorder_quantity'],
                'description' => $validated['description'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_active' => true,
            ]);

            StockLevel::create([
                'product_id' => $product->id,
                'location_id' => $validated['location_id'],
                'quantity_on_hand' => $validated['opening_quantity'],
                'quantity_reserved' => 0,
                'last_counted_at' => now(),
            ]);

            if ((float) $validated['opening_quantity'] > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'to_location_id' => $validated['location_id'],
                    'movement_type' => 'receive',
                    'quantity' => $validated['opening_quantity'],
                    'unit_cost' => $validated['cost_price'],
                    'reason' => 'Opening quantity',
                    'created_by' => Auth::user()?->name ?? 'StockPilot',
                    'created_by_user_id' => Auth::id(),
                ]);
            }

            return $product;
        });

        return response()->json(['message' => 'Product created.', 'product_id' => $product->id], 201);
    }

    public function storeMovement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'location_id' => ['required', 'exists:locations,id'],
            'to_location_id' => ['nullable', 'exists:locations,id', 'different:location_id'],
            'movement_type' => ['required', Rule::in(['receive', 'issue', 'adjust', 'transfer'])],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'movement_date' => ['nullable', 'date'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'reason_code' => ['nullable', 'string', 'max:120'],
            'reason' => ['nullable', 'string', 'max:255'],
            'reference_number' => ['nullable', 'string', 'max:120'],
        ]);

        DB::transaction(function () use ($validated): void {
            $level = StockLevel::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['location_id'],
                ],
                [
                    'quantity_on_hand' => 0,
                    'quantity_reserved' => 0,
                    'last_counted_at' => now(),
                ],
            );

            $quantity = (float) $validated['quantity'];
            $current = (float) $level->quantity_on_hand;
            $type = $validated['movement_type'];
            $product = Product::query()->findOrFail($validated['product_id']);
            $movementDate = isset($validated['movement_date']) ? Carbon::parse($validated['movement_date']) : now();

            if ($type === 'transfer' && empty($validated['to_location_id'])) {
                throw ValidationException::withMessages([
                    'to_location_id' => ['Choose a destination location for transfers.'],
                ]);
            }

            if (in_array($type, ['issue', 'transfer'], true) && $current < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['Quantity exceeds stock on hand for the selected location.'],
                ]);
            }

            if ($type === 'receive') {
                $unitCost = (float) ($validated['unit_cost'] ?? $product->cost_price);
                $currentTotalQuantity = (float) $product->stockLevels()->sum('quantity_on_hand');
                $currentTotalValue = $currentTotalQuantity * (float) $product->cost_price;
                $purchaseValue = $quantity * $unitCost;
                $newTotalQuantity = $currentTotalQuantity + $quantity;

                if ($newTotalQuantity > 0) {
                    $product->cost_price = round(($currentTotalValue + $purchaseValue) / $newTotalQuantity, 2);
                    $product->save();
                }

                PurchaseItem::create([
                    'product_id' => $product->id,
                    'supplier_id' => $validated['supplier_id'] ?? $product->preferred_supplier_id,
                    'location_id' => $validated['location_id'],
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['reason'] ?? null,
                    'purchased_at' => $movementDate,
                ]);
            }

            $level->quantity_on_hand = match ($type) {
                'issue', 'transfer' => $current - $quantity,
                'adjust' => $quantity,
                default => $current + $quantity,
            };
            $level->last_counted_at = now();
            $level->save();

            if ($type === 'transfer') {
                $destination = StockLevel::firstOrCreate(
                    [
                        'product_id' => $validated['product_id'],
                        'location_id' => $validated['to_location_id'],
                    ],
                    [
                        'quantity_on_hand' => 0,
                        'quantity_reserved' => 0,
                        'last_counted_at' => now(),
                    ],
                );
                $destination->quantity_on_hand = (float) $destination->quantity_on_hand + $quantity;
                $destination->last_counted_at = now();
                $destination->save();
            }

            $reasonCode = $validated['reason_code'] ?? null;
            $reasonDetails = $validated['reason'] ?? null;
            $reason = trim(implode(' - ', array_filter([$reasonCode, $reasonDetails])));

            StockMovement::create([
                'product_id' => $validated['product_id'],
                'from_location_id' => in_array($type, ['issue', 'transfer'], true) ? $validated['location_id'] : null,
                'to_location_id' => $type === 'transfer' ? $validated['to_location_id'] : (in_array($type, ['receive', 'adjust'], true) ? $validated['location_id'] : null),
                'customer_id' => $type === 'issue' ? ($validated['customer_id'] ?? null) : null,
                'movement_type' => $type,
                'quantity' => $quantity,
                'movement_date' => $movementDate,
                'unit_cost' => $type === 'receive' ? ($validated['unit_cost'] ?? $product->cost_price) : null,
                'reference_number' => $validated['reference_number'] ?? null,
                'reason' => $reason !== '' ? $reason : ucfirst($type) . ' stock',
                'created_by' => Auth::user()?->name ?? 'StockPilot',
                'created_by_user_id' => Auth::id(),
            ]);
        });

        return response()->json(['message' => 'Stock updated.']);
    }

    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'sku' => ['required', 'string', 'max:80', Rule::unique('products', 'sku')->ignore($product->id)],
            'barcode' => ['nullable', 'string', 'max:120', Rule::unique('products', 'barcode')->ignore($product->id)],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'preferred_supplier_id' => ['nullable', 'exists:suppliers,id'],
            'unit_of_measure' => ['required', 'string', 'max:40'],
            'reorder_point' => ['required', 'numeric', 'min:0'],
            'reorder_quantity' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active');
        $product->update($validated);

        return response()->json(['message' => 'Product settings updated.']);
    }

    public function storeCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:customers,name'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:80'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = Customer::create($validated);

        return response()->json(['message' => 'Customer created.', 'customer_id' => $customer->id], 201);
    }

    public function storeSupplier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:suppliers,name'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:80'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $supplier = Supplier::create($validated);

        return response()->json(['message' => 'Supplier created.', 'supplier_id' => $supplier->id], 201);
    }

    public function storeLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:80'],
            'code' => ['nullable', 'string', 'max:80', 'unique:locations,code'],
            'parent_id' => ['nullable', 'exists:locations,id'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $location = Location::create($validated);

        return response()->json(['message' => 'Location created.', 'location_id' => $location->id], 201);
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'name', 'code']),
            'customers' => Customer::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function exportProducts(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="stockpilot-products.csv"',
        ];

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'sku',
                'barcode',
                'name',
                'brand',
                'category',
                'supplier',
                'unit',
                'cost_price',
                'sale_price',
                'reorder_point',
                'reorder_quantity',
                'quantity_on_hand',
                'is_active',
                'notes',
            ]);

            Product::query()
                ->with(['category', 'preferredSupplier', 'stockLevels'])
                ->orderBy('sku')
                ->chunk(100, function ($products) use ($handle): void {
                    foreach ($products as $product) {
                        fputcsv($handle, [
                            $product->sku,
                            $product->barcode,
                            $product->name,
                            $product->brand,
                            $product->category?->name,
                            $product->preferredSupplier?->name,
                            $product->unit_of_measure,
                            $product->cost_price,
                            $product->sale_price,
                            $product->reorder_point,
                            $product->reorder_quantity,
                            $product->stockLevels->sum('quantity_on_hand'),
                            $product->is_active ? 'yes' : 'no',
                            $product->notes,
                        ]);
                    }
                });

            fclose($handle);
        }, 'stockpilot-products.csv', $headers);
    }

    public function importProducts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
            'location_id' => ['required', 'exists:locations,id'],
        ]);

        $handle = fopen($validated['file']->getRealPath(), 'r');
        $header = fgetcsv($handle);

        if (! $header) {
            throw ValidationException::withMessages(['file' => ['The CSV file is empty.']]);
        }

        $columns = array_map(fn ($value) => strtolower(trim((string) $value)), $header);
        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($handle, $columns, $validated, &$created, &$updated): void {
            while (($row = fgetcsv($handle)) !== false) {
                $data = array_combine($columns, array_pad($row, count($columns), null));
                $sku = trim((string) ($data['sku'] ?? ''));
                $name = trim((string) ($data['name'] ?? ''));

                if ($sku === '' || $name === '') {
                    continue;
                }

                $product = Product::firstOrNew(['sku' => $sku]);
                $isNew = ! $product->exists;
                $product->fill([
                    'barcode' => ($data['barcode'] ?? '') !== '' ? $data['barcode'] : null,
                    'name' => $name,
                    'brand' => ($data['brand'] ?? '') !== '' ? $data['brand'] : null,
                    'unit_of_measure' => $data['unit'] ?? 'each',
                    'cost_price' => (float) ($data['cost_price'] ?? 0),
                    'sale_price' => (float) ($data['sale_price'] ?? 0),
                    'reorder_point' => (float) ($data['reorder_point'] ?? 0),
                    'reorder_quantity' => (float) ($data['reorder_quantity'] ?? 0),
                    'is_active' => ! in_array(strtolower((string) ($data['is_active'] ?? 'yes')), ['0', 'false', 'no'], true),
                    'notes' => ($data['notes'] ?? '') !== '' ? $data['notes'] : null,
                ]);
                $product->save();

                if (isset($data['quantity_on_hand']) && (float) $data['quantity_on_hand'] > 0) {
                    StockLevel::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'location_id' => $validated['location_id'],
                        ],
                        [
                            'quantity_on_hand' => (float) $data['quantity_on_hand'],
                            'quantity_reserved' => 0,
                            'last_counted_at' => now(),
                        ],
                    );
                }

                $isNew ? $created++ : $updated++;
            }
        });

        fclose($handle);

        return response()->json([
            'message' => "Import complete. {$created} created, {$updated} updated.",
            'created' => $created,
            'updated' => $updated,
        ]);
    }
}
