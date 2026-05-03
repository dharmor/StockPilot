<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SystemController extends Controller
{
    public function users(): JsonResponse
    {
        return response()->json([
            'users' => User::query()
                ->orderBy('name')
                ->get()
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at?->format('M j, Y g:i A'),
                    'updated_at' => $user->updated_at?->format('M j, Y g:i A'),
                ]),
        ]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:4', 'confirmed'],
            'is_admin' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => $request->boolean('is_admin'),
        ]);

        return response()->json([
            'message' => 'User created.',
            'user_id' => $user->id,
        ], 201);
    }

    public function updateUserPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:4', 'confirmed'],
        ]);

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json(['message' => 'User password updated.']);
    }

    public function updateAdminPassword(Request $request): JsonResponse
    {
        $admin = User::query()
            ->where('email', 'admin@stockpilot.local')
            ->orWhere('name', 'Admin')
            ->first();

        $rules = [
            'password' => ['required', 'string', 'min:4', 'confirmed'],
        ];

        if ($admin) {
            $rules['current_password'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($admin && ! Hash::check($validated['current_password'], $admin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current admin password is incorrect.'],
            ]);
        }

        $admin ??= new User([
            'name' => 'Admin',
            'email' => 'admin@stockpilot.local',
        ]);

        $admin->password = Hash::make($validated['password']);
        $admin->save();

        return response()->json([
            'message' => $admin->wasRecentlyCreated
                ? 'Admin password created.'
                : 'Admin password updated.',
        ]);
    }
}
