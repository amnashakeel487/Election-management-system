import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url?.startsWith('https://') || !key || key.length < 20) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY at build time. ' +
        'On Vercel: add both env vars, do NOT mark them Sensitive, then redeploy.',
    )
  }

  return {
  plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
