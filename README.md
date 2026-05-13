# StockPilot

[![Website](https://img.shields.io/badge/Website-www.daves--corner.com-0b5cad?style=for-the-badge)](https://www.daves-corner.com)
[![Test it live](https://img.shields.io/badge/Test%20it%20live-StockPilot%20Login-198754?style=for-the-badge)](https://dev.daves-corner.com/live/StockPilot/public/index.php/login)

If there is a feature that could be improved or added, or even just a comment, contact me at [dave@daves-corner.com](mailto:dave@daves-corner.com).

StockPilot is a Laravel inventory management application for tracking products, stock levels, purchases, suppliers, customers, and inventory movements across one or more locations. It is designed for small teams that need a practical stock control dashboard without the overhead of a large warehouse management system.

## What It Does

StockPilot helps you see what you have in stock, where it is stored, when it was received, when it was sold or issued, and which products need attention. The app combines a browser-based inventory dashboard with product maintenance, stock movement workflows, CSV import/export, and admin user management.

Typical uses include:

- Track products by SKU, category, brand, supplier, and unit of measure.
- Monitor quantity on hand, reserved stock, available stock, cost, sale price, and reorder points.
- See low-stock products and suggested reorder quantities.
- Record stock receipts, issues, adjustments, and transfers between locations.
- Track customer-related stock issues or sales.
- Maintain suppliers, customers, and storage locations.
- Import and export product data with CSV files.
- View recent stock movements and purchase history.
- Manage app users and admin passwords.

StockPilot is useful for small warehouses, service shops, repair teams, stock rooms, retail back offices, and internal tools that need a straightforward way to track inventory movement and stock value.

## Features

- Secure login with Laravel authentication.
- Admin-only user and password management.
- Inventory overview dashboard with key metrics.
- Product catalog with SKU, barcode, brand, category, supplier, pricing, reorder, and notes.
- Multi-location stock tracking.
- Supplier and customer records.
- Stock movement history for receipts, issues, adjustments, and transfers.
- Purchase item history for received inventory.
- Low-stock reporting.
- CSV product export.
- CSV product import.
- Sample seed data for quick testing.
- MariaDB schema and sample data scripts in `database/install/`.
- React/Vite frontend assets served through Laravel.

## Requirements

- PHP 8.3 or newer
- Composer
- Node.js and NPM
- A supported database, such as MariaDB, MySQL, PostgreSQL, SQL Server, or SQLite
- A web server such as Apache, Nginx, or Laravel's local development server

## Quick Start

Install PHP dependencies:

```bash
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the Laravel app key:

```bash
php artisan key:generate
```

Update `.env` with your database settings, then run migrations and seeders:

```bash
php artisan migrate --seed
```

Install frontend dependencies and build assets:

```bash
npm install
npm run build
```

Start the local Laravel server:

```bash
php artisan serve
```

Then open:

`http://127.0.0.1:8000/login`

## Development

For local development with the Laravel server, queue listener, logs, and Vite running together:

```bash
composer run dev
```

Run tests:

```bash
composer test
```

## Default Login

The database seeder creates a starter admin account:

- Username: `Admin`
- Email: `admin@stockpilot.local`
- Password: `password`

Change the admin password after first login.

## Database Notes

The default `.env.example` is configured for MariaDB:

```env
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stockpilot
DB_USERNAME=stockpilot
DB_PASSWORD=stockpilot
```

The app also includes example settings for SQLite, MySQL, PostgreSQL, and SQL Server in `.env.example`.

Manual database setup scripts are available in:

```text
database/install/maria_schema.sql
database/install/sample_data.sql
database/install/postgres_schema.sql
database/install/postgres_sample_data.sql
database/install/mssql_schema.sql
database/install/mssql_sample_data.sql
```

## Main Screens And Workflows

- Login at `/login`.
- Inventory dashboard at `/`.
- Overview API at `/api/overview`.
- Product create/update APIs under `/api/products`.
- Product import/export APIs under `/api/products/import` and `/api/products/export`.
- Stock movement API at `/api/movements`.
- Supplier, customer, and location APIs under `/api/suppliers`, `/api/customers`, and `/api/locations`.
- Admin user APIs under `/api/system/users`.

## Version

1.0.0 Initial release
