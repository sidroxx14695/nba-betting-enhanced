/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#1E40AF', // NBA blue
          dark: '#172554',
          light: '#3B82F6',
        },
        // Secondary accent colors
        secondary: {
          DEFAULT: '#D97706', // Basketball orange
          dark: '#92400E',
          light: '#F59E0B',
        },
        // Background colors
        betting: {
          dark: '#0F172A',      // Very dark blue for main background
          card: '#1E293B',      // Slightly lighter for cards
          highlight: '#334155', // For hover states
        },
        // Team-inspired colors
        team: {
          lakers: '#552583',    // Lakers purple
          celtics: '#007A33',   // Celtics green
          heat: '#98002E',      // Heat red
          warriors: '#1D428A',  // Warriors blue
          nets: '#000000',      // Nets black
        },
        // Status colors
        status: {
          win: '#10B981',       // Green for wins
          loss: '#EF4444',      // Red for losses
          live: '#F59E0B',      // Amber for live games
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'court-pattern': "url('/src/assets/court-pattern.png')",
      },
    },
  },
  plugins: [],
}
