import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
        cors: {
            origin: [
                'http://localhost:8000',
                'http://127.0.0.1:8000',
            ],
        },
        hmr: {
            host: 'localhost',
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: isSsrBuild ? {} : {
            output: {
                manualChunks: {
                    ui: ['@headlessui/react', 'lucide-react', 'sonner'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
}));
