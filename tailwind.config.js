/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pond: {
          light: "#E0F7FA",
          mid: "#B2EBF2",
          deep: "#80DEEA",
          dark: "#00838F",
          lily: "#2E7D32",
          lotus: "#F06292",
          wood: "#8D6E63",
          woodDark: "#5D4037",
        },
        insta: {
          gradientStart: "#F58529",
          gradientMid: "#DD2A7B",
          gradientEnd: "#8134AF",
          bubbleOutStart: "#7638fa",
          bubbleOutEnd: "#d300c5",
          bubbleIn: "#F3F4F6",
          online: "#22C55E",
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        heartBurst: {
          '0%': { transform: 'scale(0.4) rotate(-10deg)', opacity: '0' },
          '50%': { transform: 'scale(1.25) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      animation: {
        ripple: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        bob: 'bob 3s ease-in-out infinite',
        heartBurst: 'heartBurst 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
    },
  },
  plugins: [],
};
