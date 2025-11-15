/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#34A853',
          600: '#16A34A',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EA4335',
          600: '#DC2626',
        },
        warning: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          400: '#FACC15',
          500: '#EAB308',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 8px rgba(0, 0, 0, 0.05)',
        'custom-md': '0 8px 16px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}