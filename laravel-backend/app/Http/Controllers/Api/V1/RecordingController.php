<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecordingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = DB::table('audio_recordings')
            ->where('user_id', $request->user()->id)
            ->get(['profile_id as profileId', 'favorite_id as favoriteId', 'mime_type as mimeType', 'data_base64 as dataUrl']);

        return response()->json(['recordings' => $rows]);
    }

    public function show(Request $request, string $profileId, string $favoriteId): JsonResponse
    {
        $row = DB::table('audio_recordings')
            ->where('user_id', $request->user()->id)
            ->where('profile_id', $profileId)
            ->where('favorite_id', $favoriteId)
            ->first(['mime_type as mimeType', 'data_base64 as dataUrl']);

        if (!$row) {
            return response()->json(['error' => 'No encontrado'], 404);
        }

        return response()->json($row);
    }

    public function upsert(Request $request, string $profileId, string $favoriteId): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'mimeType' => ['required', 'string', 'max:100'],
            'dataUrl' => ['required', 'string', 'starts_with:data:'],
        ])->validate();

        DB::table('audio_recordings')->updateOrInsert(
            [
                'user_id' => $request->user()->id,
                'profile_id' => $profileId,
                'favorite_id' => $favoriteId,
            ],
            [
                'mime_type' => $validated['mimeType'],
                'data_base64' => $validated['dataUrl'],
                'updated_at' => now(),
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, string $profileId, string $favoriteId): JsonResponse
    {
        DB::table('audio_recordings')
            ->where('user_id', $request->user()->id)
            ->where('profile_id', $profileId)
            ->where('favorite_id', $favoriteId)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
