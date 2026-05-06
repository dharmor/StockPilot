-- StockPilot PostgreSQL schema install script.
-- Run this while connected to the stockpilot database.

DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS failed_jobs CASCADE;
DROP TABLE IF EXISTS job_batches CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

CREATE INDEX sessions_user_id_index ON sessions (user_id);
CREATE INDEX sessions_last_activity_index ON sessions (last_activity);

CREATE TABLE cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration BIGINT NOT NULL
);

CREATE INDEX cache_expiration_index ON cache (expiration);

CREATE TABLE cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration BIGINT NOT NULL
);

CREATE INDEX cache_locks_expiration_index ON cache_locks (expiration);

CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER NULL,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX jobs_queue_index ON jobs (queue);

CREATE TABLE job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT NULL,
    cancelled_at INTEGER NULL,
    created_at INTEGER NOT NULL,
    finished_at INTEGER NULL
);

CREATE TABLE failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid)
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT categories_name_unique UNIQUE (name),
    CONSTRAINT categories_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
);

CREATE INDEX categories_parent_id_index ON categories (parent_id);

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    website VARCHAR(255) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'warehouse',
    code VARCHAR(255) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT locations_code_unique UNIQUE (code),
    CONSTRAINT locations_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES locations (id) ON DELETE SET NULL
);

CREATE INDEX locations_parent_id_index ON locations (parent_id);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NULL,
    preferred_supplier_id BIGINT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    brand VARCHAR(255) NULL,
    unit_of_measure VARCHAR(255) NOT NULL DEFAULT 'each',
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reorder_point DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reorder_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    image VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_barcode_unique UNIQUE (barcode),
    CONSTRAINT products_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    CONSTRAINT products_preferred_supplier_id_foreign FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL
);

CREATE INDEX products_category_id_index ON products (category_id);
CREATE INDEX products_preferred_supplier_id_index ON products (preferred_supplier_id);

CREATE TABLE stock_levels (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    quantity_on_hand DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity_reserved DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    last_counted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT stock_levels_product_id_location_id_unique UNIQUE (product_id, location_id),
    CONSTRAINT stock_levels_product_id_foreign FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT stock_levels_location_id_foreign FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
);

CREATE INDEX stock_levels_location_id_index ON stock_levels (location_id);

CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    from_location_id BIGINT NULL,
    to_location_id BIGINT NULL,
    movement_type VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NULL,
    reference_number VARCHAR(255) NULL,
    reason VARCHAR(255) NULL,
    created_by VARCHAR(255) NULL,
    created_by_user_id BIGINT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    customer_id BIGINT NULL,
    movement_date TIMESTAMP NULL,
    CONSTRAINT stock_movements_product_id_foreign FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT stock_movements_from_location_id_foreign FOREIGN KEY (from_location_id) REFERENCES locations (id) ON DELETE SET NULL,
    CONSTRAINT stock_movements_to_location_id_foreign FOREIGN KEY (to_location_id) REFERENCES locations (id) ON DELETE SET NULL,
    CONSTRAINT stock_movements_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
    CONSTRAINT stock_movements_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX stock_movements_product_id_index ON stock_movements (product_id);
CREATE INDEX stock_movements_from_location_id_index ON stock_movements (from_location_id);
CREATE INDEX stock_movements_to_location_id_index ON stock_movements (to_location_id);
CREATE INDEX stock_movements_customer_id_index ON stock_movements (customer_id);
CREATE INDEX stock_movements_created_by_user_id_index ON stock_movements (created_by_user_id);

CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    supplier_id BIGINT NULL,
    location_id BIGINT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    reference_number VARCHAR(255) NULL,
    notes TEXT NULL,
    purchased_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT purchase_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT purchase_items_supplier_id_foreign FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
    CONSTRAINT purchase_items_location_id_foreign FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL
);

CREATE INDEX purchase_items_product_id_index ON purchase_items (product_id);
CREATE INDEX purchase_items_supplier_id_index ON purchase_items (supplier_id);
CREATE INDEX purchase_items_location_id_index ON purchase_items (location_id);

INSERT INTO migrations (migration, batch) VALUES
('0001_01_01_000000_create_users_table', 1),
('0001_01_01_000001_create_cache_table', 1),
('0001_01_01_000002_create_jobs_table', 1),
('2026_04_27_091254_create_categories_table', 1),
('2026_04_27_091258_create_suppliers_table', 1),
('2026_04_27_091302_create_locations_table', 1),
('2026_04_27_091307_create_products_table', 1),
('2026_04_27_091311_create_stock_levels_table', 1),
('2026_04_27_091315_create_stock_movements_table', 1),
('2026_04_27_104038_create_customers_table', 1),
('2026_04_27_104039_add_customer_id_to_stock_movements_table', 1),
('2026_04_27_105052_create_purchase_items_table', 1),
('2026_04_27_110236_add_movement_date_to_stock_movements_table', 1),
('2026_05_01_210000_add_is_admin_to_users_table', 1),
('2026_05_01_210001_add_created_by_user_id_to_stock_movements_table', 1);
