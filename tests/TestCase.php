<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function signIn(?User $user = null): User
    {
        $user ??= User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    protected function signInAdmin(?User $user = null): User
    {
        $user ??= User::factory()->admin()->create();
        $this->actingAs($user);

        return $user;
    }
}
