<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('audio_recordings') || Schema::hasColumn('audio_recordings', 'voice_owner')) {
            return;
        }

        Schema::table('audio_recordings', function (Blueprint $table) {
            $table->string('voice_owner', 32)->default('family')->after('favorite_id');
        });

        DB::table('audio_recordings')
            ->whereNull('voice_owner')
            ->update(['voice_owner' => 'family']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('audio_recordings') || !Schema::hasColumn('audio_recordings', 'voice_owner')) {
            return;
        }

        Schema::table('audio_recordings', function (Blueprint $table) {
            $table->dropColumn('voice_owner');
        });
    }
};