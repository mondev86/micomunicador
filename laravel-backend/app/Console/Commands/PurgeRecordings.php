<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeRecordings extends Command
{
    /**
     * Elimina de la base de datos las grabaciones de audio que llevan N días
     * sin modificarse. Mantiene acotado el crecimiento del almacenamiento cloud.
     */
    protected $signature = 'recordings:purge {--days=30 : Días de inactividad antes de borrar}';

    protected $description = 'Borra grabaciones de audio vencidas (sin modificarse en N días)';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));

        $deleted = DB::table('audio_recordings')
            ->where('updated_at', '<', now()->subDays($days))
            ->delete();

        $this->info("Purga de grabaciones: {$deleted} eliminadas a partir de {$days} días de inactividad.");

        return self::SUCCESS;
    }
}
