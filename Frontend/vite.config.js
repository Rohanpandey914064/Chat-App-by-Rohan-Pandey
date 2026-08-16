import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    // Raise the chunk size warning threshold to 1 MB
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      onwarn(warning, warn) {
        // Suppress unresolved import warnings for known peer deps
        // that are handled at runtime by the host environment
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.message?.includes('@react-aria/utils')
        ) {
          return
        }
        warn(warning)
      },
    },
  },
})
