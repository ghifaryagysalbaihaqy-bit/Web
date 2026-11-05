<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">

        <title inertia>{{ config('app.name', 'CloudVault') }} - Private Enterprise Cloud Storage</title>

        <!-- Primary Meta Tags -->
        <meta name="title" content="{{ config('app.name', 'CloudVault') }} - Private Enterprise Cloud Storage">
        <meta name="description" content="CloudVault adalah solusi penyimpanan cloud mandiri berkecepatan tinggi, aman, dan privat. Fitur drag & drop, berbagi berkas terproteksi, pencarian canggih, riwayat versi, dan analitik penyimpanan.">
        <meta name="keywords" content="cloud storage, cloudvault, file manager, private cloud, penyimpanan berkas, hosting file pribadi, secure cloud drive, manajemen dokumen">
        <meta name="author" content="CloudVault Storage">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        <meta name="theme-color" content="#F2A900">
        <meta name="application-name" content="CloudVault">
        <meta name="apple-mobile-web-app-title" content="CloudVault">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <!-- Canonical URL -->
        <link rel="canonical" href="{{ url()->current() }}">

        <!-- Open Graph / Facebook / WhatsApp -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:site_name" content="CloudVault">
        <meta property="og:locale" content="{{ str_replace('_', '-', app()->getLocale()) }}">
        <meta property="og:title" content="{{ config('app.name', 'CloudVault') }} - Private Enterprise Cloud Storage">
        <meta property="og:description" content="Penyimpanan cloud mandiri berkecepatan tinggi dengan enkripsi, drag & drop cepat, pratinjau instan dokumen, dan kontrol akses ketat.">
        <meta property="og:image" content="{{ asset('favicon.svg') }}">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="{{ config('app.name', 'CloudVault') }} - Private Enterprise Cloud Storage">
        <meta name="twitter:description" content="Penyimpanan cloud mandiri berkecepatan tinggi dengan enkripsi, drag & drop cepat, pratinjau instan dokumen, dan kontrol akses ketat.">
        <meta name="twitter:image" content="{{ asset('favicon.svg') }}">

        <!-- Web App Manifest & Favicons -->
        <link rel="manifest" href="{{ asset('site.webmanifest') }}">
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%23F2A900'/><path d='M17.5 17H9a5 5 0 1 1 4.79-6.43A5.5 5.5 0 0 1 16 12a3.5 3.5 0 0 1 1.5 5Z' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>">
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%23F2A900'/><path d='M17.5 17H9a5 5 0 1 1 4.79-6.43A5.5 5.5 0 0 1 16 12a3.5 3.5 0 0 1 1.5 5Z' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>">

        <!-- Google Fonts: Poppins -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">

        <!-- Schema.org Structured Data (JSON-LD) -->
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'WebApplication',
                    '@id' => url('/').'#webapp',
                    'name' => 'CloudVault',
                    'url' => url('/'),
                    'applicationCategory' => 'BusinessApplication',
                    'operatingSystem' => 'All',
                    'description' => 'Platform penyimpanan cloud mandiri berkecepatan tinggi, aman, dan privat dengan fitur drag & drop serta manajemen dokumen tingkat lanjut.',
                    'browserRequirements' => 'Requires JavaScript. Requires HTML5.',
                    'offers' => [
                        '@type' => 'Offer',
                        'price' => '0',
                        'priceCurrency' => 'IDR',
                    ],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => url('/').'#website',
                    'name' => 'CloudVault Storage',
                    'url' => url('/'),
                    'description' => 'Penyimpanan cloud mandiri berkecepatan tinggi dan aman di server sendiri.',
                    'inLanguage' => str_replace('_', '-', app()->getLocale()),
                ],
                [
                    '@type' => 'Organization',
                    '@id' => url('/').'#organization',
                    'name' => 'CloudVault',
                    'url' => url('/'),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => asset('favicon.svg'),
                    ],
                ],
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
        </script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-white text-slate-800">
        @inertia
    </body>
</html>
