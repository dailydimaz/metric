import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/tracker/track.ts'),
            name: 'mmmetric',
            fileName: () => 'track.js',
            formats: ['iife'], // Immediately Invoked Function Expression for direct browser support
        },
        outDir: 'public',
        emptyOutDir: false, // Don't delete other files in public
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
            mangle: {
                toplevel: true,
            },
        },
    },
});
