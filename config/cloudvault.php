<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Allow All File Types
    |--------------------------------------------------------------------------
    |
    | When set to true, users are allowed to upload any file type (e.g. exe,
    | zip, pdf, iso, apk, php scripts, media, etc.) without restriction.
    | Files are safely stored outside the web root in private storage
    | with random filenames and cannot be executed on the server.
    |
    */
    'allow_all_file_types' => env('ALLOW_ALL_FILE_TYPES', true),

    /*
    |--------------------------------------------------------------------------
    | Default User Storage Limit
    |--------------------------------------------------------------------------
    |
    | Default quota in bytes allocated for newly registered users (5 GB).
    |
    */
    'default_storage_limit' => env('DEFAULT_STORAGE_LIMIT', 5368709120),
];
