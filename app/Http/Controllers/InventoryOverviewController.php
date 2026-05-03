<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryOverviewController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category', 'preferredSupplier', 'stockLevels.location'])
            ->orderBy('name')
            ->get();

        $stockValue = $products->sum(function (Product $product): float {
            return $product->stockLevels->sum('quantity_on_hand') * (float) $product->cost_price;
        });

        $lowStock = $products
            ->filter(function (Product $product): bool {
                return $product->stockLevels->sum('quantity_available') <= (float) $product->reorder_point;
            })
            ->values();

        $lastReceived = StockMovement::query()
            ->where('movement_type', 'receive')
            ->selectRaw('product_id, max(coalesce(movement_date, created_at)) as last_date')
            ->groupBy('product_id')
            ->pluck('last_date', 'product_id');

        $lastSold = StockMovement::query()
            ->where('movement_type', 'issue')
            ->where(function ($query): void {
                $query->where('reason', 'like', 'Sold%')
                    ->orWhereNotNull('customer_id');
            })
            ->selectRaw('product_id, max(coalesce(movement_date, created_at)) as last_date')
            ->groupBy('product_id')
            ->pluck('last_date', 'product_id');

        $purchaseQuery = PurchaseItem::query()
            ->with(['product', 'supplier', 'location'])
            ->latest('purchased_at')
            ->limit(100);

        if ($request->filled('product')) {
            $purchaseQuery->whereHas('product', fn ($query) => $query->where('name', (string) $request->string('product')));
        }

        if ($request->filled('supplier')) {
            $purchaseQuery->whereHas('supplier', fn ($query) => $query->where('name', (string) $request->string('supplier')));
        }

        if ($request->filled('from')) {
            $purchaseQuery->whereDate('purchased_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $purchaseQuery->whereDate('purchased_at', '<=', $request->date('to'));
        }

        return response()->json([
            'current_user' => [
                'id' => $request->user()?->id,
                'name' => $request->user()?->name,
                'is_admin' => (bool) $request->user()?->is_admin,
            ],
            'metrics' => [
                'products' => $products->count(),
                'locations' => Location::count(),
                'suppliers' => Supplier::count(),
                'customers' => Customer::count(),
                'stock_value' => round($stockValue, 2),
                'low_stock' => $lowStock->count(),
            ],
            'products' => $products->map(fn (Product $product): array => [
                'id' => $product->id,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'name' => $product->name,
                'brand' => $product->brand,
                'description' => $product->description,
                'notes' => $product->notes,
                'category_id' => $product->category_id,
                'preferred_supplier_id' => $product->preferred_supplier_id,
                'category' => $product->category?->name,
                'supplier' => $product->preferredSupplier?->name,
                'unit' => $product->unit_of_measure,
                'cost_price' => (float) $product->cost_price,
                'sale_price' => (float) $product->sale_price,
                'reorder_point' => (float) $product->reorder_point,
                'reorder_quantity' => (float) $product->reorder_quantity,
                'quantity_on_hand' => $product->stockLevels->sum('quantity_on_hand'),
                'quantity_reserved' => $product->stockLevels->sum('quantity_reserved'),
                'quantity_available' => $product->stockLevels->sum('quantity_available'),
                'is_active' => (bool) $product->is_active,
                'last_received_at' => isset($lastReceived[$product->id]) ? date('M j, Y', strtotime($lastReceived[$product->id])) : null,
                'last_sold_at' => isset($lastSold[$product->id]) ? date('M j, Y', strtotime($lastSold[$product->id])) : null,
            ]),
            'low_stock' => $lowStock->map(fn (Product $product): array => [
                'sku' => $product->sku,
                'name' => $product->name,
                'available' => $product->stockLevels->sum('quantity_available'),
                'reorder_point' => (float) $product->reorder_point,
                'reorder_quantity' => (float) $product->reorder_quantity,
                'supplier' => $product->preferredSupplier?->name,
            ]),
            'locations' => Location::query()
                ->orderBy('name')
                ->get(['id', 'name', 'type', 'code', 'parent_id', 'address']),
            'suppliers' => Supplier::query()
                ->withCount('products')
                ->orderBy('name')
                ->get()
                ->map(fn (Supplier $supplier): array => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'website' => $supplier->website,
                    'products_count' => $supplier->products_count,
                ]),
            'customers' => Customer::query()
                ->withCount('stockMovements')
                ->orderBy('name')
                ->get()
                ->map(fn (Customer $customer): array => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'contact_name' => $customer->contact_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'stock_movements_count' => $customer->stock_movements_count,
                ]),
            'movements' => StockMovement::query()
                ->with(['product', 'fromLocation', 'toLocation', 'customer', 'creator'])
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (StockMovement $movement): array => [
                    'id' => $movement->id,
                    'product' => $movement->product?->name,
                    'type' => $movement->movement_type,
                    'quantity' => (float) $movement->quantity,
                    'from' => $movement->fromLocation?->name,
                    'to' => $movement->toLocation?->name,
                    'customer' => $movement->customer?->name,
                    'reference' => $movement->reference_number,
                    'reason' => $movement->reason,
                    'created_by' => $movement->creator?->name ?? $movement->created_by,
                    'created_at' => ($movement->movement_date ?? $movement->created_at)?->format('M j, Y g:i A'),
                ]),
            'purchases' => $purchaseQuery
                ->get()
                ->map(fn (PurchaseItem $purchase): array => [
                    'id' => $purchase->id,
                    'product' => $purchase->product?->name,
                    'supplier' => $purchase->supplier?->name,
                    'location' => $purchase->location?->name,
                    'quantity' => (float) $purchase->quantity,
                    'unit_cost' => (float) $purchase->unit_cost,
                    'reference' => $purchase->reference_number,
                    'purchased_at' => $purchase->purchased_at?->format('M j, Y g:i A'),
                ]),
        ]);
    }
}
