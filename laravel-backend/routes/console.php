<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('app:about', function () {
    $this->comment('Mi Comunicador SaaS backend');
})->purpose('Show information about the app');
