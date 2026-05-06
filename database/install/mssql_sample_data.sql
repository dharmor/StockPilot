-- StockPilot SQL Server sample data install script.
-- Run this after mssql_schema.sql.

USE stockpilot;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @two_days_ago DATETIME2 = DATEADD(DAY, -2, @now);
DECLARE @three_days_ago DATETIME2 = DATEADD(DAY, -3, @now);
DECLARE @five_days_ago DATETIME2 = DATEADD(DAY, -5, @now);
DECLARE @six_days_ago DATETIME2 = DATEADD(DAY, -6, @now);
DECLARE @eight_days_ago DATETIME2 = DATEADD(DAY, -8, @now);
DECLARE @fourteen_days_ago DATETIME2 = DATEADD(DAY, -14, @now);

SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users
    (id, name, email, email_verified_at, password, is_admin, remember_token, created_at, updated_at)
VALUES
    (1, N'Admin', N'admin@stockpilot.local', @now, N'$2y$12$k/djR2Stl58pKxRjQDm5CeXLOxUXtMQpIX5b9HJfnnLZUzifEATY.', 1, NULL, @now, @now);
SET IDENTITY_INSERT dbo.users OFF;

SET IDENTITY_INSERT dbo.categories ON;
INSERT INTO dbo.categories
    (id, parent_id, name, description, created_at, updated_at)
VALUES
    (1, NULL, N'Hardware', N'Physical parts, fixtures, and shop stock.', @now, @now),
    (2, NULL, N'Electronics', N'Cables, adapters, and device components.', @now, @now),
    (3, NULL, N'Supplies', N'Consumable office and packing supplies.', @now, @now);
SET IDENTITY_INSERT dbo.categories OFF;

SET IDENTITY_INSERT dbo.suppliers ON;
INSERT INTO dbo.suppliers
    (id, name, contact_name, email, phone, website, address, notes, created_at, updated_at)
VALUES
    (1, N'Northwind Supply Co.', N'Alex Morgan', N'orders@northwind.example', N'555-0142', NULL, NULL, NULL, @now, @now),
    (2, N'Harbor Parts Direct', N'Jordan Lee', N'sales@harborparts.example', N'555-0188', NULL, NULL, NULL, @now, @now);
SET IDENTITY_INSERT dbo.suppliers OFF;

SET IDENTITY_INSERT dbo.locations ON;
INSERT INTO dbo.locations
    (id, parent_id, name, type, code, address, notes, created_at, updated_at)
VALUES
    (1, NULL, N'Main Warehouse', N'warehouse', N'WH-MAIN', NULL, NULL, @now, @now),
    (2, 1, N'Front Shelf A', N'shelf', N'A-01', NULL, NULL, @now, @now),
    (3, NULL, N'Service Room', N'room', N'SR-01', NULL, NULL, @now, @now);
SET IDENTITY_INSERT dbo.locations OFF;

SET IDENTITY_INSERT dbo.customers ON;
INSERT INTO dbo.customers
    (id, name, contact_name, email, phone, address, notes, created_at, updated_at)
VALUES
    (1, N'Walk-in Customer', N'Front Counter', NULL, NULL, NULL, N'Default customer for point-of-sale style removals.', @now, @now);
SET IDENTITY_INSERT dbo.customers OFF;

SET IDENTITY_INSERT dbo.products ON;
INSERT INTO dbo.products
    (id, category_id, preferred_supplier_id, sku, barcode, name, description, brand, unit_of_measure, cost_price, sale_price, reorder_point, reorder_quantity, image, is_active, notes, created_at, updated_at)
VALUES
    (1, 1, 2, N'HD-BOLT-001', N'100000000001', N'Stainless Bolt Pack', NULL, N'HarborLine', N'pack', 4.25, 8.99, 20.00, 50.00, NULL, 1, NULL, @now, @now),
    (2, 2, 1, N'EL-USB-C-002', N'100000000002', N'USB-C Cable 6ft', NULL, N'Northwind', N'each', 3.10, 10.00, 30.00, 75.00, NULL, 1, NULL, @now, @now),
    (3, 3, 1, N'SP-LABEL-003', N'100000000003', N'Thermal Barcode Labels', NULL, N'LabelPro', N'roll', 7.50, 14.50, 15.00, 30.00, NULL, 1, NULL, @now, @now);
SET IDENTITY_INSERT dbo.products OFF;

SET IDENTITY_INSERT dbo.stock_levels ON;
INSERT INTO dbo.stock_levels
    (id, product_id, location_id, quantity_on_hand, quantity_reserved, last_counted_at, created_at, updated_at)
VALUES
    (1, 1, 2, 18.00, 2.00, @three_days_ago, @now, @now),
    (2, 1, 3, 6.00, 0.00, @five_days_ago, @now, @now),
    (3, 2, 2, 82.00, 12.00, @six_days_ago, @now, @now),
    (4, 2, 1, 140.00, 0.00, @eight_days_ago, @now, @now),
    (5, 3, 1, 9.00, 0.00, @two_days_ago, @now, @now);
SET IDENTITY_INSERT dbo.stock_levels OFF;

SET IDENTITY_INSERT dbo.purchase_items ON;
INSERT INTO dbo.purchase_items
    (id, product_id, supplier_id, location_id, quantity, unit_cost, reference_number, notes, purchased_at, created_at, updated_at)
VALUES
    (1, 1, 2, 2, 18.00, 4.25, N'OPENING', N'Opening stock cost', @fourteen_days_ago, @now, @now),
    (2, 1, 2, 3, 6.00, 4.25, N'OPENING', N'Opening stock cost', @fourteen_days_ago, @now, @now),
    (3, 2, 1, 2, 82.00, 3.10, N'OPENING', N'Opening stock cost', @fourteen_days_ago, @now, @now),
    (4, 2, 1, 1, 140.00, 3.10, N'OPENING', N'Opening stock cost', @fourteen_days_ago, @now, @now),
    (5, 3, 1, 1, 9.00, 7.50, N'OPENING', N'Opening stock cost', @fourteen_days_ago, @now, @now);
SET IDENTITY_INSERT dbo.purchase_items OFF;

SET IDENTITY_INSERT dbo.stock_movements ON;
INSERT INTO dbo.stock_movements
    (id, product_id, from_location_id, to_location_id, movement_type, quantity, unit_cost, reference_number, reason, created_by, created_by_user_id, created_at, updated_at, customer_id, movement_date)
VALUES
    (1, 1, NULL, 2, N'receive', 24.00, 4.25, N'PO-1001', N'Opening stock receipt', N'System', NULL, @now, @now, NULL, @fourteen_days_ago),
    (2, 3, 1, NULL, N'issue', 6.00, NULL, NULL, N'Sold - Label printer setup kits', N'System', NULL, @now, @now, 1, @two_days_ago);
SET IDENTITY_INSERT dbo.stock_movements OFF;

DBCC CHECKIDENT ('dbo.users', RESEED, 1);
DBCC CHECKIDENT ('dbo.categories', RESEED, 3);
DBCC CHECKIDENT ('dbo.suppliers', RESEED, 2);
DBCC CHECKIDENT ('dbo.locations', RESEED, 3);
DBCC CHECKIDENT ('dbo.customers', RESEED, 1);
DBCC CHECKIDENT ('dbo.products', RESEED, 3);
DBCC CHECKIDENT ('dbo.stock_levels', RESEED, 5);
DBCC CHECKIDENT ('dbo.purchase_items', RESEED, 5);
DBCC CHECKIDENT ('dbo.stock_movements', RESEED, 2);
GO
