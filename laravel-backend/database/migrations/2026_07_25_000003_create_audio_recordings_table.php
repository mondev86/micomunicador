<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('audio_recordings')) {
            return;
        }

        Schema::create('audio_recordings', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('profile_id', 191);
            $table->string('favorite_id', 191);
            $table->string('mime_type', 100)->default('audio/webm');
            $table->longText('data_base64');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->primary(['user_id', 'profile_id', 'favorite_id']);
            $table->index(['user_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_recordings');
    }
};
