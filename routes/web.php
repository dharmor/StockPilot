<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryActionController;
use App\Http\Controllers\InventoryOverviewController;
use App\Http\Controllers\SystemController;

Route::get('/', function () {
    return view('app');
})->middleware('auth');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

Route::middleware('auth')->group(function (): void {
    Route::get('/api/overview', InventoryOverviewController::class);
    Route::get('/api/options', [InventoryActionController::class, 'options']);
    Route::post('/api/products', [InventoryActionController::class, 'storeProduct']);
    Route::put('/api/products/{product}', [InventoryActionController::class, 'updateProduct']);
    Route::get('/api/products/export', [InventoryActionController::class, 'exportProducts']);
    Route::post('/api/products/import', [InventoryActionController::class, 'importProducts']);
    Route::post('/api/movements', [InventoryActionController::class, 'storeMovement']);
    Route::post('/api/suppliers', [InventoryActionController::class, 'storeSupplier']);
    Route::post('/api/locations', [InventoryActionController::class, 'storeLocation']);
    Route::post('/api/customers', [InventoryActionController::class, 'storeCustomer']);
});

Route::middleware(['auth', 'admin'])->group(function (): void {
    Route::get('/api/system/users', [SystemController::class, 'users']);
    Route::post('/api/system/users', [SystemController::class, 'storeUser']);
    Route::put('/api/system/users/{user}/password', [SystemController::class, 'updateUserPassword']);
    Route::put('/api/system/admin-password', [SystemController::class, 'updateAdminPassword']);
});
