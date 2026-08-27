import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      tailwindcss(),
      react()],
    server: {
      // 5203 matches this app's documented dev port (CLAUDE.md, .env.example)
      // when VITE_PORT/PORT aren't set — not Vite's generic 5173 default,
      // which this previously fell back to and didn't match either doc.
      port: parseInt(env.VITE_PORT || env.PORT) || 5203,
    },
  }
})
