<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('app:about', function () {
    $this->comment('Mi Comunicador SaaS backend');
})->purpose('Show information about the app');

// Ejecuta la purga de grabaciones de audio vencidas una vez al día.
Schedule::command('recordings:purge --days=30')->daily();
