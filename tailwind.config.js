/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ui: {
          shell: 'var(--ui-shell)',
          surface: 'var(--ui-surface)',
          elevated: 'var(--ui-elevated)',
          hover: 'var(--ui-hover)',
          border: 'var(--ui-border)',
          text: 'var(--ui-text)',
          muted: 'var(--ui-muted)',
          accent: 'var(--ui-accent)',
          accentHover: 'var(--ui-accent-hover)',
          accentSoft: 'var(--ui-accent-soft)',
          viewport: 'var(--ui-viewport)',
          success: 'var(--ui-success)',
          danger: 'var(--ui-danger)',
        },
        iso: {
          bg: 'var(--ui-shell)',
          panel: 'var(--ui-surface)',
          elevated: 'var(--ui-elevated)',
          line: 'var(--ui-border)',
          lineStrong: 'var(--ui-border)',
          ink: 'var(--ui-text)',
          inkSecondary: 'var(--ui-muted)',
          inkMuted: 'var(--ui-muted)',
          accent: 'var(--ui-accent)',
          accentHover: 'var(--ui-accent-hover)',
          signal: 'var(--ui-success)',
          warning: '#f59e0b',
          danger: 'var(--ui-danger)',
        }
      },
      fontFamily: {
        sans: ['"Archivo"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"Azeret Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
};
