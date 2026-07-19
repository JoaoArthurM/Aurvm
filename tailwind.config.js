/** @type {import('tailwindcss').Config} */
// Cores via var() não aceitam modificador de opacidade (ex.: bg-accent/10) no Tailwind v3;
// a forma de função com color-mix devolve esse suporte mantendo os tokens em styles.css.
const token = (variable) => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? `var(${variable})`
    : `color-mix(in srgb, var(${variable}) calc(${opacityValue} * 100%), transparent)`

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('--bg'), surface: token('--surface'), el: token('--el'), border: token('--border'),
        accent: token('--accent'), green: token('--green'), yellow: token('--yellow'), red: token('--red'),
        'red-light': token('--red-light'), t1: token('--t1'), t2: token('--t2'), t3: token('--t3'), flux: token('--flux-orange'),
      },
      boxShadow: { glow: '0 0 34px rgba(255,106,26,.22)' },
      fontFamily: {
        sans: ['Archivo', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'Archivo', 'ui-sans-serif', 'system-ui'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
}
