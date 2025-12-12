import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file - load all env vars (not just VITE_ prefixed)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Support both API_KEY and VITE_API_KEY for flexibility
  const apiKey = env.VITE_API_KEY || env.API_KEY;
  
  return {
    plugins: [react()],
    define: {
      // Expose API key to client code via import.meta.env
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.API_KEY': JSON.stringify(apiKey),
      // Also support process.env for compatibility
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_API_KEY': JSON.stringify(apiKey),
    },
  };
});