<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StateController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $row = DB::table('app_user_state')->where('user_id', $request->user()->id)->first();
        $payload = $row ? json_decode($row->payload, true) : [];

        return response()->json([
            'payload' => is_array($payload) ? $payload : [],
        ]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'payload' => ['required', 'array'],
        ])->validate();

        DB::table('app_user_state')->updateOrInsert(
            ['user_id' => $request->user()->id],
            [
                'payload' => json_encode($validated['payload'], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]
        );

        return response()->json(['ok' => true]);
    }
}
