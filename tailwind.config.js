/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iso: {
          bg: '#121519',
          panel: '#1a1f26',
          elevated: '#212730',
          line: '#2a313c',
          lineStrong: '#384252',
          ink: '#e6edf3',
          inkSecondary: '#9ba9bb',
          inkMuted: '#7c8b9e',
          accent: '#ff5a26',
          accentHover: '#ff7142',
          signal: '#2ea043',
          warning: '#d29922',
          danger: '#f85149',
        }
      },
      fontFamily: {
        sans: ['"Archivo"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Azeret Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
};
