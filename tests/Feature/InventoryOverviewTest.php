<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_overview_returns_seeded_metrics(): void
    {
        $this->seed();
        $this->signIn();

        $response = $this->getJson('/api/overview');

        $response
            ->assertOk()
            ->assertJsonPath('metrics.products', 3)
            ->assertJsonPath('metrics.locations', 3)
            ->assertJsonPath('metrics.suppliers', 2)
            ->assertJsonCount(3, 'products')
            ->assertJsonCount(1, 'low_stock');
    }

    public function test_product_can_be_created_from_api(): void
    {
        $this->seed();
        $this->signIn();

        $options = $this->getJson('/api/options')->json();

        $response = $this->postJson('/api/products', [
            'sku' => 'NEW-001',
            'barcode' => '999000111222',
            'name' => 'New Test Item',
            'category_id' => $options['categories'][0]['id'],
            'preferred_supplier_id' => $options['suppliers'][0]['id'],
            'unit_of_measure' => 'each',
            'cost_price' => 2.50,
            'sale_price' => 5.00,
            'reorder_point' => 4,
            'reorder_quantity' => 10,
            'location_id' => $options['locations'][0]['id'],
            'opening_quantity' => 3,
        ]);

        $response->assertCreated()->assertJsonPath('message', 'Product created.');
        $this->assertDatabaseHas('products', ['sku' => 'NEW-001']);
    }

    public function test_stock_movement_updates_quantity(): void
    {
        $this->seed();
        $this->signIn();

        $overview = $this->getJson('/api/overview')->json();
        $options = $this->getJson('/api/options')->json();

        $response = $this->postJson('/api/movements', [
            'product_id' => $overview['products'][0]['id'],
            'location_id' => $options['locations'][0]['id'],
            'movement_type' => 'receive',
            'quantity' => 5,
            'unit_cost' => 6.25,
            'supplier_id' => $options['suppliers'][0]['id'],
            'reason_code' => 'Restock',
            'reason' => 'Test receipt',
        ]);

        $response->assertOk()->assertJsonPath('message', 'Stock updated.');
        $this->assertDatabaseHas('stock_movements', ['reason' => 'Restock - Test receipt']);
        $this->assertDatabaseHas('purchase_items', ['unit_cost' => 6.25, 'quantity' => 5]);
    }

    public function test_receiving_stock_updates_average_cost(): void
    {
        $this->seed();
        $this->signIn();

        $overview = $this->getJson('/api/overview')->json();
        $options = $this->getJson('/api/options')->json();
        $product = $overview['products'][0];
        $oldQuantity = (float) $product['quantity_on_hand'];
        $oldCost = (float) $product['cost_price'];

        $this->postJson('/api/movements', [
            'product_id' => $product['id'],
            'location_id' => $options['locations'][0]['id'],
            'movement_type' => 'receive',
            'quantity' => 10,
            'unit_cost' => 12.00,
            'reason_code' => 'Purchase order',
            'reason' => 'Average cost test',
        ])->assertOk();

        $expected = round((($oldQuantity * $oldCost) + (10 * 12.00)) / ($oldQuantity + 10), 2);
        $this->assertDatabaseHas('products', ['id' => $product['id'], 'cost_price' => $expected]);
    }

    public function test_stock_can_be_removed_as_sold(): void
    {
        $this->seed();
        $this->signIn();

        $overview = $this->getJson('/api/overview')->json();
        $options = $this->getJson('/api/options')->json();

        $response = $this->postJson('/api/movements', [
            'product_id' => $overview['products'][0]['id'],
            'location_id' => $options['locations'][0]['id'],
            'movement_type' => 'issue',
            'quantity' => 1,
            'customer_id' => $options['customers'][0]['id'],
            'reason_code' => 'Sold',
            'reason' => 'Invoice 1002',
        ]);

        $response->assertOk()->assertJsonPath('message', 'Stock updated.');
        $this->assertDatabaseHas('stock_movements', [
            'movement_type' => 'issue',
            'reason' => 'Sold - Invoice 1002',
            'customer_id' => $options['customers'][0]['id'],
        ]);
    }

    public function test_product_reorder_settings_can_be_updated(): void
    {
        $this->seed();
        $this->signIn();

        $productId = $this->getJson('/api/overview')->json('products.0.id');
        $product = $this->getJson('/api/overview')->json('products.0');

        $response = $this->putJson("/api/products/{$productId}", [
            'sku' => $product['sku'],
            'barcode' => $product['barcode'],
            'name' => $product['name'],
            'category_id' => $product['category_id'],
            'preferred_supplier_id' => $product['preferred_supplier_id'],
            'unit_of_measure' => $product['unit'],
            'reorder_point' => 12,
            'reorder_quantity' => 24,
            'cost_price' => 3.75,
            'sale_price' => 9.25,
            'is_active' => true,
        ]);

        $response->assertOk()->assertJsonPath('message', 'Product settings updated.');
        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'reorder_point' => 12,
            'reorder_quantity' => 24,
        ]);
    }

    public function test_supplier_can_be_created_from_api(): void
    {
        $this->seed();
        $this->signIn();

        $response = $this->postJson('/api/suppliers', [
            'name' => 'New Supplier Co.',
            'contact_name' => 'Casey Taylor',
            'email' => 'casey@supplier.example',
            'phone' => '555-0199',
            'website' => 'https://supplier.example',
        ]);

        $response->assertCreated()->assertJsonPath('message', 'Supplier created.');
        $this->assertDatabaseHas('suppliers', ['name' => 'New Supplier Co.']);
    }

    public function test_location_can_be_created_from_api(): void
    {
        $this->seed();
        $this->signIn();

        $response = $this->postJson('/api/locations', [
            'name' => 'Overflow Bin',
            'type' => 'bin',
            'code' => 'BIN-99',
            'address' => 'Back room',
            'notes' => 'Temporary overflow stock.',
        ]);

        $response->assertCreated()->assertJsonPath('message', 'Location created.');
        $this->assertDatabaseHas('locations', ['code' => 'BIN-99']);
    }

    public function test_customer_can_be_created_from_api(): void
    {
        $this->seed();
        $this->signIn();

        $response = $this->postJson('/api/customers', [
            'name' => 'Acme Customer',
            'contact_name' => 'Morgan Smith',
            'email' => 'morgan@acme.example',
            'phone' => '555-0110',
        ]);

        $response->assertCreated()->assertJsonPath('message', 'Customer created.');
        $this->assertDatabaseHas('customers', ['name' => 'Acme Customer']);
    }

    public function test_stock_issue_cannot_exceed_available_quantity(): void
    {
        $this->seed();
        $this->signIn();

        $overview = $this->getJson('/api/overview')->json();
        $options = $this->getJson('/api/options')->json();

        $this->postJson('/api/movements', [
            'product_id' => $overview['products'][0]['id'],
            'location_id' => $options['locations'][0]['id'],
            'movement_type' => 'issue',
            'quantity' => 999999,
            'reason_code' => 'Sold',
        ])->assertUnprocessable();
    }

    public function test_stock_can_be_transferred_between_locations(): void
    {
        $this->seed();
        $this->signIn();

        $overview = $this->getJson('/api/overview')->json();
        $options = $this->getJson('/api/options')->json();

        $this->postJson('/api/movements', [
            'product_id' => $overview['products'][0]['id'],
            'location_id' => $options['locations'][0]['id'],
            'to_location_id' => $options['locations'][1]['id'],
            'movement_type' => 'transfer',
            'quantity' => 1,
            'reason_code' => 'Relocation',
        ])->assertOk();

        $this->assertDatabaseHas('stock_movements', [
            'movement_type' => 'transfer',
            'from_location_id' => $options['locations'][0]['id'],
            'to_location_id' => $options['locations'][1]['id'],
        ]);
    }

    public function test_system_users_require_admin_access(): void
    {
        $this->seed();
        $this->signIn();

        $this->getJson('/api/system/users')->assertForbidden();
    }

    public function test_admin_can_create_admin_user(): void
    {
        $this->seed();
        $this->signInAdmin();

        $this->postJson('/api/system/users', [
            'name' => 'Ops Admin',
            'email' => 'ops@example.com',
            'password' => 'secret',
            'password_confirmation' => 'secret',
            'is_admin' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'ops@example.com',
            'is_admin' => true,
        ]);
    }
}
