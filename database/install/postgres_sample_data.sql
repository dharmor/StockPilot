-- StockPilot PostgreSQL sample data install script.
-- Run this after postgres_schema.sql.

INSERT INTO users
    (id, name, email, email_verified_at, password, is_admin, remember_token, created_at, updated_at)
VALUES
    (1, 'Admin', 'admin@stockpilot.local', NOW(), '$2y$12$k/djR2Stl58pKxRjQDm5CeXLOxUXtMQpIX5b9HJfnnLZUzifEATY.', TRUE, NULL, NOW(), NOW());

INSERT INTO categories
    (id, parent_id, name, description, created_at, updated_at)
VALUES
    (1, NULL, 'Hardware', 'Physical parts, fixtures, and shop stock.', NOW(), NOW()),
    (2, NULL, 'Electronics', 'Cables, adapters, and device components.', NOW(), NOW()),
    (3, NULL, 'Supplies', 'Consumable office and packing supplies.', NOW(), NOW());

INSERT INTO suppliers
    (id, name, contact_name, email, phone, website, address, notes, created_at, updated_at)
VALUES
    (1, 'Northwind Supply Co.', 'Alex Morgan', 'orders@northwind.example', '555-0142', NULL, NULL, NULL, NOW(), NOW()),
    (2, 'Harbor Parts Direct', 'Jordan Lee', 'sales@harborparts.example', '555-0188', NULL, NULL, NULL, NOW(), NOW());

INSERT INTO locations
    (id, parent_id, name, type, code, address, notes, created_at, updated_at)
VALUES
    (1, NULL, 'Main Warehouse', 'warehouse', 'WH-MAIN', NULL, NULL, NOW(), NOW()),
    (2, 1, 'Front Shelf A', 'shelf', 'A-01', NULL, NULL, NOW(), NOW()),
    (3, NULL, 'Service Room', 'room', 'SR-01', NULL, NULL, NOW(), NOW());

INSERT INTO customers
    (id, name, contact_name, email, phone, address, notes, created_at, updated_at)
VALUES
    (1, 'Walk-in Customer', 'Front Counter', NULL, NULL, NULL, 'Default customer for point-of-sale style removals.', NOW(), NOW());

INSERT INTO products
    (id, category_id, preferred_supplier_id, sku, barcode, name, description, brand, unit_of_measure, cost_price, sale_price, reorder_point, reorder_quantity, image, is_active, notes, created_at, updated_at)
VALUES
    (1, 1, 2, 'HD-BOLT-001', '100000000001', 'Stainless Bolt Pack', NULL, 'HarborLine', 'pack', 4.25, 8.99, 20.00, 50.00, NULL, TRUE, NULL, NOW(), NOW()),
    (2, 2, 1, 'EL-USB-C-002', '100000000002', 'USB-C Cable 6ft', NULL, 'Northwind', 'each', 3.10, 10.00, 30.00, 75.00, NULL, TRUE, NULL, NOW(), NOW()),
    (3, 3, 1, 'SP-LABEL-003', '100000000003', 'Thermal Barcode Labels', NULL, 'LabelPro', 'roll', 7.50, 14.50, 15.00, 30.00, NULL, TRUE, NULL, NOW(), NOW());

INSERT INTO stock_levels
    (id, product_id, location_id, quantity_on_hand, quantity_reserved, last_counted_at, created_at, updated_at)
VALUES
    (1, 1, 2, 18.00, 2.00, NOW() - INTERVAL '3 days', NOW(), NOW()),
    (2, 1, 3, 6.00, 0.00, NOW() - INTERVAL '5 days', NOW(), NOW()),
    (3, 2, 2, 82.00, 12.00, NOW() - INTERVAL '6 days', NOW(), NOW()),
    (4, 2, 1, 140.00, 0.00, NOW() - INTERVAL '8 days', NOW(), NOW()),
    (5, 3, 1, 9.00, 0.00, NOW() - INTERVAL '2 days', NOW(), NOW());

INSERT INTO purchase_items
    (id, product_id, supplier_id, location_id, quantity, unit_cost, reference_number, notes, purchased_at, created_at, updated_at)
VALUES
    (1, 1, 2, 2, 18.00, 4.25, 'OPENING', 'Opening stock cost', NOW() - INTERVAL '14 days', NOW(), NOW()),
    (2, 1, 2, 3, 6.00, 4.25, 'OPENING', 'Opening stock cost', NOW() - INTERVAL '14 days', NOW(), NOW()),
    (3, 2, 1, 2, 82.00, 3.10, 'OPENING', 'Opening stock cost', NOW() - INTERVAL '14 days', NOW(), NOW()),
    (4, 2, 1, 1, 140.00, 3.10, 'OPENING', 'Opening stock cost', NOW() - INTERVAL '14 days', NOW(), NOW()),
    (5, 3, 1, 1, 9.00, 7.50, 'OPENING', 'Opening stock cost', NOW() - INTERVAL '14 days', NOW(), NOW());

INSERT INTO stock_movements
    (id, product_id, from_location_id, to_location_id, movement_type, quantity, unit_cost, reference_number, reason, created_by, created_by_user_id, created_at, updated_at, customer_id, movement_date)
VALUES
    (1, 1, NULL, 2, 'receive', 24.00, 4.25, 'PO-1001', 'Opening stock receipt', 'System', NULL, NOW(), NOW(), NULL, NOW() - INTERVAL '14 days'),
    (2, 3, 1, NULL, 'issue', 6.00, NULL, NULL, 'Sold - Label printer setup kits', 'System', NULL, NOW(), NOW(), 1, NOW() - INTERVAL '2 days');

SELECT setval('users_id_seq', 1, TRUE);
SELECT setval('categories_id_seq', 3, TRUE);
SELECT setval('suppliers_id_seq', 2, TRUE);
SELECT setval('locations_id_seq', 3, TRUE);
SELECT setval('customers_id_seq', 1, TRUE);
SELECT setval('products_id_seq', 3, TRUE);
SELECT setval('stock_levels_id_seq', 5, TRUE);
SELECT setval('purchase_items_id_seq', 5, TRUE);
SELECT setval('stock_movements_id_seq', 2, TRUE);
