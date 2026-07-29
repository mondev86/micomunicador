<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private function getRequestPayload(Request $request): array
    {
        $payload = $request->all();

        if (!empty($payload)) {
            return $payload;
        }

        $content = $request->getContent();
        if (!is_string($content) || $content === '') {
            return [];
        }

        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        return [];
    }

    public function register(Request $request): JsonResponse
    {
        $payload = $this->getRequestPayload($request);

        $validated = Validator::make($payload, [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ])->validate();

        $user = User::create([
            'email' => strtolower($validated['email']),
            'password_hash' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $payload = $this->getRequestPayload($request);

        $validated = Validator::make($payload, [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ])->validate();

        $user = User::where('email', strtolower($validated['email']))->first();

        if (!$user || !Hash::check($validated['password'], $user->password_hash)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
            ],
        ]);
    }
}
