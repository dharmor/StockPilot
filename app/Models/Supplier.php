<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'contact_name', 'email', 'phone', 'website', 'address', 'notes'];

    public function products()
    {
        return $this->hasMany(Product::class, 'preferred_supplier_id');
    }
}
