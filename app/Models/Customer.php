<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'contact_name', 'email', 'phone', 'address', 'notes'];

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
