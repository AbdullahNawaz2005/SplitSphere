import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
})
