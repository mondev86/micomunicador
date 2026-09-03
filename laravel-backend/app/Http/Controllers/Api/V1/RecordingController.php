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
            ->get(['profile_id as profileId', 'favorite_id as favoriteId', 'voice_owner as voiceOwner', 'mime_type as mimeType', 'data_base64 as dataUrl']);

        return response()->json(['recordings' => $rows]);
    }

    // Grabaciones próximas a vencer (sin modificar en ~30 días), para avisar
    // al usuario de que las descargue antes de la purga automática.
    public function expiring(Request $request): JsonResponse
    {
        $cutoff = now()->subDays(30);
        $rows = DB::table('audio_recordings')
            ->where('user_id', $request->user()->id)
            ->where('updated_at', '<', $cutoff->copy()->addDays(7))
            ->get(['profile_id as profileId', 'favorite_id as favoriteId', 'voice_owner as voiceOwner', 'updated_at as lastModified']);

        return response()->json([
            'expired' => $rows->filter(fn ($row) => strtotime($row->lastModified) < $cutoff->getTimestamp())->values(),
            'expiring' => $rows->filter(fn ($row) => strtotime($row->lastModified) >= $cutoff->getTimestamp())->values(),
        ]);
    }

    public function show(Request $request, string $profileId, string $favoriteId): JsonResponse
    {
        $row = DB::table('audio_recordings')
            ->where('user_id', $request->user()->id)
            ->where('profile_id', $profileId)
            ->where('favorite_id', $favoriteId)
            ->first(['voice_owner as voiceOwner', 'mime_type as mimeType', 'data_base64 as dataUrl']);

        if (!$row) {
            return response()->json(['error' => 'No encontrado'], 404);
        }

        return response()->json($row);
    }

    public function upsert(Request $request, string $profileId, string $favoriteId): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'voiceOwner' => ['nullable', 'in:family,therapist'],
            'mimeType' => ['required', 'string', 'max:100'],
            'dataUrl' => ['required', 'string', 'starts_with:data:', 'max:20000000'],
        ])->validate();

        DB::table('audio_recordings')->updateOrInsert(
            [
                'user_id' => $request->user()->id,
                'profile_id' => $profileId,
                'favorite_id' => $favoriteId,
            ],
            [
                'voice_owner' => $validated['voiceOwner'] ?? 'family',
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
