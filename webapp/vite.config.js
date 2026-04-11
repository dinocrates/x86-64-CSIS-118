import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/x86-64-CSIS-118/',
  plugins: [svelte()],
  assetsInclude: ['**/*.elf'],
})