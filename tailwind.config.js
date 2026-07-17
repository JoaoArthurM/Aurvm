/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', el: 'var(--el)', border: 'var(--border)',
        accent: 'var(--accent)', green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)',
        'red-light': 'var(--red-light)', t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', flux: 'var(--flux-orange)',
      },
      boxShadow: { glow: '0 0 34px rgba(217,119,79,.22)' },
      fontFamily: {
        sans: ['Archivo', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'Archivo', 'ui-sans-serif', 'system-ui'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
