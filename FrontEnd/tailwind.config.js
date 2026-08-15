/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // UI body: clear at small sizes — tables, forms, sidebar
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        // Headings: calm medical serif (not decorative like Playfair)
        serif: ['Literata', 'Georgia', 'serif'],
      },
      colors: {
        sage: {
          mist: '#eef7f2',
          pale: '#d0e8dc',
          light: '#6aaf94',
          DEFAULT: '#3d9170',
          mid: '#2d7a5f',
          deep: '#1e5c47',
        },
        ink: {
          ghost: '#9abcae',
          soft: '#587569',
          DEFAULT: '#162820',
        },
        cream: '#f6faf8',
        'border-sage': '#ddeee6',
        success: '#2d8a5e',
        'success-bg': '#eaf6f0',
        warning: '#c97b2e',
        'warning-bg': '#fff8ec',
        danger: '#c04a4a',
        'danger-bg': '#fff0f0',
      },
      spacing: {
        'layout-x': '1.5rem',
        'layout-y': '1.25rem',
        'card-x': '1.25rem',
        'card-y': '1rem',
        'btn-x': '1.25rem',
        'btn-y': '0.625rem',
        'input-x': '0.875rem',
        'input-y': '0.75rem',
      },
      borderRadius: {
        card: '1rem',
        btn: '0.625rem',
      },
    },
  },
  plugins: [],
};
