<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', $locale ?? app()->getLocale()) }}"
      dir="{{ $dir ?? 'ltr' }}"
      @class([
          'dark' => ($appearance ?? 'system') == 'dark',
          'rtl' => ($dir ?? 'ltr') === 'rtl',
          'ltr' => ($dir ?? 'ltr') === 'ltr',
      ])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Apply locale direction immediately to avoid LTR/RTL flash --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';
            const cookieLocale = document.cookie
                .split('; ')
                .find((row) => row.startsWith('locale='))
                ?.split('=')[1];
            const locale = cookieLocale || '{{ $locale ?? app()->getLocale() }}';
            const dir = locale === 'ar' ? 'rtl' : 'ltr';

            document.documentElement.lang = locale;
            document.documentElement.dir = dir;
            document.documentElement.classList.toggle('rtl', dir === 'rtl');
            document.documentElement.classList.toggle('ltr', dir === 'ltr');

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
