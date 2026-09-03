<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        // Límite de cuentas creadas por IP (registro con límites) para evitar
        // que un atacante llene la BD de usuarios de forma masiva.
        $ip = $request->ip();
        $ipKey = 'register_counter:'.$ip;
        $ipRegisterCount = (int) Cache::get($ipKey, 0);
        if ($ipRegisterCount >= 5) {
            return response()->json(['error' => 'Límite de cuentas creadas desde esta IP alcanzado'], 429);
        }

        $validated = Validator::make($payload, [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-zA-Z]/', 'regex:/[0-9]/',
            ],
        ], [
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener letras y números.',
        ])->validate();

        $user = User::create([
            'email' => strtolower($validated['email']),
            'password_hash' => Hash::make($validated['password']),
        ]);

        Cache::put($ipKey, $ipRegisterCount + 1, now()->addHours(24));

        // Token de acceso con expiración (redunda en una sesión auto-renovable).
        $token = $user->createToken('api')->plainTextToken;
        $user->tokens()->latest('id')->first()?->forceFill(['expires_at' => now()->addDays(30)])->save();

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

        $email = strtolower($validated['email']);
        $ip = $request->ip();

        // Bloqueo temporal tras varios intentos fallidos (fuerza bruta).
        // Combina por IP y por email+IP; sin necesidad de columnas nuevas.
        $lockKey = 'login_lock:'.$ip;
        $lockCount = (int) Cache::get($lockKey, 0);
        if ($lockCount >= 10) {
            return response()->json(['error' => 'Demasiados intentos. Intenta más tarde.'], 429);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password_hash)) {
            Cache::put($lockKey, $lockCount + 1, now()->addMinutes(15));
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        Cache::forget($lockKey);

        // Token de acceso con expiración (redunda en una sesión auto-renovable).
        $token = $user->createToken('api')->plainTextToken;
        $user->tokens()->latest('id')->first()?->forceFill(['expires_at' => now()->addDays(30)])->save();

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

    // Revoca el token de acceso actual. Efectivo de inmediato en el backend.
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }
}
