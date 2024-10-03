import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "node:path"
import { qrcode } from "vite-plugin-qrcode"
import dusk from "vite-plugin-dusk"

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);

            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: "", // Makes paths relative
    plugins: [
        react(),
        phasermsg(),
        qrcode(), // only applies in dev mode
        react(),
        dusk({
            logicPath: path.resolve("./src/logic.ts"),
            minifyLogic: false, // This flag can be used if your logic reaches the allowed limit. However, it will make it significantly more difficult to detect validation issues
            ignoredDependencies: ['ts-matrix'],
        }),
    ],
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
