-- StockPilot SQL Server schema install script.

IF DB_ID(N'stockpilot') IS NULL
BEGIN
    CREATE DATABASE stockpilot;
END
GO

USE stockpilot;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

DROP TABLE IF EXISTS dbo.purchase_items;
DROP TABLE IF EXISTS dbo.stock_movements;
DROP TABLE IF EXISTS dbo.stock_levels;
DROP TABLE IF EXISTS dbo.products;
DROP TABLE IF EXISTS dbo.customers;
DROP TABLE IF EXISTS dbo.locations;
DROP TABLE IF EXISTS dbo.suppliers;
DROP TABLE IF EXISTS dbo.categories;
DROP TABLE IF EXISTS dbo.failed_jobs;
DROP TABLE IF EXISTS dbo.job_batches;
DROP TABLE IF EXISTS dbo.jobs;
DROP TABLE IF EXISTS dbo.cache_locks;
DROP TABLE IF EXISTS dbo.cache;
DROP TABLE IF EXISTS dbo.sessions;
DROP TABLE IF EXISTS dbo.password_reset_tokens;
DROP TABLE IF EXISTS dbo.users;
DROP TABLE IF EXISTS dbo.migrations;
GO

CREATE TABLE dbo.migrations (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    migration NVARCHAR(255) NOT NULL,
    batch INT NOT NULL
);

CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    email_verified_at DATETIME2 NULL,
    password NVARCHAR(255) NOT NULL,
    is_admin BIT NOT NULL CONSTRAINT df_users_is_admin DEFAULT 0,
    remember_token NVARCHAR(100) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE dbo.password_reset_tokens (
    email NVARCHAR(255) NOT NULL PRIMARY KEY,
    token NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NULL
);

CREATE TABLE dbo.sessions (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    user_id BIGINT NULL,
    ip_address NVARCHAR(45) NULL,
    user_agent NVARCHAR(MAX) NULL,
    payload NVARCHAR(MAX) NOT NULL,
    last_activity INT NOT NULL
);

CREATE INDEX sessions_user_id_index ON dbo.sessions (user_id);
CREATE INDEX sessions_last_activity_index ON dbo.sessions (last_activity);

CREATE TABLE dbo.cache (
    [key] NVARCHAR(255) NOT NULL PRIMARY KEY,
    [value] NVARCHAR(MAX) NOT NULL,
    expiration BIGINT NOT NULL
);

CREATE INDEX cache_expiration_index ON dbo.cache (expiration);

CREATE TABLE dbo.cache_locks (
    [key] NVARCHAR(255) NOT NULL PRIMARY KEY,
    owner NVARCHAR(255) NOT NULL,
    expiration BIGINT NOT NULL
);

CREATE INDEX cache_locks_expiration_index ON dbo.cache_locks (expiration);

CREATE TABLE dbo.jobs (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    queue NVARCHAR(255) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INT NULL,
    available_at INT NOT NULL,
    created_at INT NOT NULL
);

CREATE INDEX jobs_queue_index ON dbo.jobs (queue);

CREATE TABLE dbo.job_batches (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    total_jobs INT NOT NULL,
    pending_jobs INT NOT NULL,
    failed_jobs INT NOT NULL,
    failed_job_ids NVARCHAR(MAX) NOT NULL,
    options NVARCHAR(MAX) NULL,
    cancelled_at INT NULL,
    created_at INT NOT NULL,
    finished_at INT NULL
);

CREATE TABLE dbo.failed_jobs (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    uuid NVARCHAR(255) NOT NULL,
    connection NVARCHAR(MAX) NOT NULL,
    queue NVARCHAR(MAX) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    exception NVARCHAR(MAX) NOT NULL,
    failed_at DATETIME2 NOT NULL CONSTRAINT df_failed_jobs_failed_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid)
);

CREATE TABLE dbo.categories (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    parent_id BIGINT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT categories_name_unique UNIQUE (name),
    CONSTRAINT categories_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES dbo.categories (id)
);

CREATE INDEX categories_parent_id_index ON dbo.categories (parent_id);

CREATE TABLE dbo.suppliers (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(255) NULL,
    website NVARCHAR(255) NULL,
    address NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);

CREATE TABLE dbo.locations (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    parent_id BIGINT NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(255) NOT NULL CONSTRAINT df_locations_type DEFAULT N'warehouse',
    code NVARCHAR(255) NULL,
    address NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT locations_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES dbo.locations (id)
);

CREATE INDEX locations_parent_id_index ON dbo.locations (parent_id);
CREATE UNIQUE INDEX locations_code_unique ON dbo.locations (code) WHERE code IS NOT NULL;

CREATE TABLE dbo.customers (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(255) NULL,
    address NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);

CREATE TABLE dbo.products (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    category_id BIGINT NULL,
    preferred_supplier_id BIGINT NULL,
    sku NVARCHAR(255) NOT NULL,
    barcode NVARCHAR(255) NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    brand NVARCHAR(255) NULL,
    unit_of_measure NVARCHAR(255) NOT NULL CONSTRAINT df_products_unit_of_measure DEFAULT N'each',
    cost_price DECIMAL(12,2) NOT NULL CONSTRAINT df_products_cost_price DEFAULT 0.00,
    sale_price DECIMAL(12,2) NOT NULL CONSTRAINT df_products_sale_price DEFAULT 0.00,
    reorder_point DECIMAL(12,2) NOT NULL CONSTRAINT df_products_reorder_point DEFAULT 0.00,
    reorder_quantity DECIMAL(12,2) NOT NULL CONSTRAINT df_products_reorder_quantity DEFAULT 0.00,
    image NVARCHAR(255) NULL,
    is_active BIT NOT NULL CONSTRAINT df_products_is_active DEFAULT 1,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_category_id_foreign FOREIGN KEY (category_id) REFERENCES dbo.categories (id) ON DELETE SET NULL,
    CONSTRAINT products_preferred_supplier_id_foreign FOREIGN KEY (preferred_supplier_id) REFERENCES dbo.suppliers (id) ON DELETE SET NULL
);

CREATE INDEX products_category_id_index ON dbo.products (category_id);
CREATE INDEX products_preferred_supplier_id_index ON dbo.products (preferred_supplier_id);
CREATE UNIQUE INDEX products_barcode_unique ON dbo.products (barcode) WHERE barcode IS NOT NULL;

CREATE TABLE dbo.stock_levels (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    quantity_on_hand DECIMAL(12,2) NOT NULL CONSTRAINT df_stock_levels_quantity_on_hand DEFAULT 0.00,
    quantity_reserved DECIMAL(12,2) NOT NULL CONSTRAINT df_stock_levels_quantity_reserved DEFAULT 0.00,
    last_counted_at DATETIME2 NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT stock_levels_product_id_location_id_unique UNIQUE (product_id, location_id),
    CONSTRAINT stock_levels_product_id_foreign FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
    CONSTRAINT stock_levels_location_id_foreign FOREIGN KEY (location_id) REFERENCES dbo.locations (id) ON DELETE CASCADE
);

CREATE INDEX stock_levels_location_id_index ON dbo.stock_levels (location_id);

CREATE TABLE dbo.stock_movements (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    from_location_id BIGINT NULL,
    to_location_id BIGINT NULL,
    movement_type NVARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NULL,
    reference_number NVARCHAR(255) NULL,
    reason NVARCHAR(255) NULL,
    created_by NVARCHAR(255) NULL,
    created_by_user_id BIGINT NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    customer_id BIGINT NULL,
    movement_date DATETIME2 NULL,
    CONSTRAINT stock_movements_product_id_foreign FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
    CONSTRAINT stock_movements_from_location_id_foreign FOREIGN KEY (from_location_id) REFERENCES dbo.locations (id) ON DELETE SET NULL,
    CONSTRAINT stock_movements_to_location_id_foreign FOREIGN KEY (to_location_id) REFERENCES dbo.locations (id),
    CONSTRAINT stock_movements_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES dbo.customers (id) ON DELETE SET NULL,
    CONSTRAINT stock_movements_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES dbo.users (id) ON DELETE SET NULL
);

CREATE INDEX stock_movements_product_id_index ON dbo.stock_movements (product_id);
CREATE INDEX stock_movements_from_location_id_index ON dbo.stock_movements (from_location_id);
CREATE INDEX stock_movements_to_location_id_index ON dbo.stock_movements (to_location_id);
CREATE INDEX stock_movements_customer_id_index ON dbo.stock_movements (customer_id);
CREATE INDEX stock_movements_created_by_user_id_index ON dbo.stock_movements (created_by_user_id);

CREATE TABLE dbo.purchase_items (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    supplier_id BIGINT NULL,
    location_id BIGINT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    reference_number NVARCHAR(255) NULL,
    notes NVARCHAR(MAX) NULL,
    purchased_at DATETIME2 NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT purchase_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
    CONSTRAINT purchase_items_supplier_id_foreign FOREIGN KEY (supplier_id) REFERENCES dbo.suppliers (id) ON DELETE SET NULL,
    CONSTRAINT purchase_items_location_id_foreign FOREIGN KEY (location_id) REFERENCES dbo.locations (id)
);

CREATE INDEX purchase_items_product_id_index ON dbo.purchase_items (product_id);
CREATE INDEX purchase_items_supplier_id_index ON dbo.purchase_items (supplier_id);
CREATE INDEX purchase_items_location_id_index ON dbo.purchase_items (location_id);

INSERT INTO dbo.migrations (migration, batch) VALUES
(N'0001_01_01_000000_create_users_table', 1),
(N'0001_01_01_000001_create_cache_table', 1),
(N'0001_01_01_000002_create_jobs_table', 1),
(N'2026_04_27_091254_create_categories_table', 1),
(N'2026_04_27_091258_create_suppliers_table', 1),
(N'2026_04_27_091302_create_locations_table', 1),
(N'2026_04_27_091307_create_products_table', 1),
(N'2026_04_27_091311_create_stock_levels_table', 1),
(N'2026_04_27_091315_create_stock_movements_table', 1),
(N'2026_04_27_104038_create_customers_table', 1),
(N'2026_04_27_104039_add_customer_id_to_stock_movements_table', 1),
(N'2026_04_27_105052_create_purchase_items_table', 1),
(N'2026_04_27_110236_add_movement_date_to_stock_movements_table', 1),
(N'2026_05_01_210000_add_is_admin_to_users_table', 1),
(N'2026_05_01_210001_add_created_by_user_id_to_stock_movements_table', 1);
GO
