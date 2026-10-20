<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('personagens:export {file=personagens-backup.json}', function (string $file) {
    $path = str_starts_with($file, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\/]/', $file) ? $file : base_path($file);
    $json = json_encode(DB::table('personagens')->orderBy('id')->get(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

    if (file_put_contents($path, $json.PHP_EOL) === false) {
        throw new RuntimeException("Não foi possível gravar {$path}.");
    }

    $this->info('Backup criado sem alterar o banco: '.$path);
})->purpose('Exporta personagens para um JSON portável antes da migração');

Artisan::command('personagens:import {file} {--update : Atualiza IDs que já existem}', function (string $file) {
    $path = str_starts_with($file, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\/]/', $file) ? $file : base_path($file);
    $rows = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    $columns = ['id', 'nome', 'descricao', 'data_nascimento', 'idade', 'poderes', 'raca', 'parentesco_divino', 'imagem', 'created_at', 'updated_at'];

    DB::transaction(function () use ($rows, $columns) {
        foreach ($rows as $row) {
            $data = array_intersect_key($row, array_flip($columns));
            $this->option('update')
                ? DB::table('personagens')->updateOrInsert(['id' => $data['id']], $data)
                : DB::table('personagens')->insertOrIgnore($data);
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('personagens', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM personagens");
        }
    });

    $this->info(count($rows).' registro(s) processado(s). Registros existentes só mudam com --update.');
})->purpose('Importa o backup de personagens sem apagar registros existentes');
