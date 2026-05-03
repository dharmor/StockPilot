<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@stockpilot.local'],
            [
                'name' => 'Admin',
                'password' => 'password',
                'is_admin' => true,
            ],
        );

        $hardware = Category::create(['name' => 'Hardware', 'description' => 'Physical parts, fixtures, and shop stock.']);
        $electronics = Category::create(['name' => 'Electronics', 'description' => 'Cables, adapters, and device components.']);
        $supplies = Category::create(['name' => 'Supplies', 'description' => 'Consumable office and packing supplies.']);

        $northwind = Supplier::create([
            'name' => 'Northwind Supply Co.',
            'contact_name' => 'Alex Morgan',
            'email' => 'orders@northwind.example',
            'phone' => '555-0142',
        ]);

        $harbor = Supplier::create([
            'name' => 'Harbor Parts Direct',
            'contact_name' => 'Jordan Lee',
            'email' => 'sales@harborparts.example',
            'phone' => '555-0188',
        ]);

        $mainWarehouse = Location::create(['name' => 'Main Warehouse', 'type' => 'warehouse', 'code' => 'WH-MAIN']);
        $frontShelf = Location::create(['parent_id' => $mainWarehouse->id, 'name' => 'Front Shelf A', 'type' => 'shelf', 'code' => 'A-01']);
        $serviceRoom = Location::create(['name' => 'Service Room', 'type' => 'room', 'code' => 'SR-01']);

        $customer = Customer::create([
            'name' => 'Walk-in Customer',
            'contact_name' => 'Front Counter',
            'notes' => 'Default customer for point-of-sale style removals.',
        ]);

        $products = [
            [
                'product' => Product::create([
                    'category_id' => $hardware->id,
                    'preferred_supplier_id' => $harbor->id,
                    'sku' => 'HD-BOLT-001',
                    'barcode' => '100000000001',
                    'name' => 'Stainless Bolt Pack',
                    'brand' => 'HarborLine',
                    'unit_of_measure' => 'pack',
                    'cost_price' => 4.25,
                    'sale_price' => 8.99,
                    'reorder_point' => 20,
                    'reorder_quantity' => 50,
                    'is_active' => true,
                ]),
                'levels' => [[$frontShelf, 18, 2], [$serviceRoom, 6, 0]],
            ],
            [
                'product' => Product::create([
                    'category_id' => $electronics->id,
                    'preferred_supplier_id' => $northwind->id,
                    'sku' => 'EL-USB-C-002',
                    'barcode' => '100000000002',
                    'name' => 'USB-C Cable 6ft',
                    'brand' => 'Northwind',
                    'unit_of_measure' => 'each',
                    'cost_price' => 3.10,
                    'sale_price' => 10.00,
                    'reorder_point' => 30,
                    'reorder_quantity' => 75,
                    'is_active' => true,
                ]),
                'levels' => [[$frontShelf, 82, 12], [$mainWarehouse, 140, 0]],
            ],
            [
                'product' => Product::create([
                    'category_id' => $supplies->id,
                    'preferred_supplier_id' => $northwind->id,
                    'sku' => 'SP-LABEL-003',
                    'barcode' => '100000000003',
                    'name' => 'Thermal Barcode Labels',
                    'brand' => 'LabelPro',
                    'unit_of_measure' => 'roll',
                    'cost_price' => 7.50,
                    'sale_price' => 14.50,
                    'reorder_point' => 15,
                    'reorder_quantity' => 30,
                    'is_active' => true,
                ]),
                'levels' => [[$mainWarehouse, 9, 0]],
            ],
        ];

        foreach ($products as $entry) {
            foreach ($entry['levels'] as [$location, $onHand, $reserved]) {
                StockLevel::create([
                    'product_id' => $entry['product']->id,
                    'location_id' => $location->id,
                    'quantity_on_hand' => $onHand,
                    'quantity_reserved' => $reserved,
                    'last_counted_at' => now()->subDays(rand(1, 12)),
                ]);

                PurchaseItem::create([
                    'product_id' => $entry['product']->id,
                    'supplier_id' => $entry['product']->preferred_supplier_id,
                    'location_id' => $location->id,
                    'quantity' => $onHand,
                    'unit_cost' => $entry['product']->cost_price,
                    'reference_number' => 'OPENING',
                    'notes' => 'Opening stock cost',
                    'purchased_at' => now()->subDays(14),
                ]);
            }
        }

        StockMovement::create([
            'product_id' => $products[0]['product']->id,
            'to_location_id' => $frontShelf->id,
            'movement_type' => 'receive',
            'quantity' => 24,
            'movement_date' => now()->subDays(14),
            'unit_cost' => 4.25,
            'reference_number' => 'PO-1001',
            'reason' => 'Opening stock receipt',
            'created_by' => 'System',
        ]);

        StockMovement::create([
            'product_id' => $products[2]['product']->id,
            'from_location_id' => $mainWarehouse->id,
            'customer_id' => $customer->id,
            'movement_type' => 'issue',
            'quantity' => 6,
            'movement_date' => now()->subDays(2),
            'reason' => 'Sold - Label printer setup kits',
            'created_by' => 'System',
        ]);
    }
}
