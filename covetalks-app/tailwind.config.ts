import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'lg:hidden',
    'lg:flex',
    'lg:block',
    'lg:ml-64',
    'lg:ml-20',
    'ml-0',
    'lg:w-64',
    'lg:w-20',
    'w-full',
    'z-40',
    'z-50',
    'z-[60]',
    'z-[70]',
    'sticky',
    'fixed',
    '-translate-x-full',
    'translate-x-0',
    'lg:translate-x-0',
    'hidden',
    'flex',
    'block',
  ],
  theme: {
    extend: {
      colors: {
        deep: '#063A54',
        calm: '#00758F',
        sand: '#E2AD79',
        foam: '#E8F0F4',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#00758F',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: '#063A54',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: '#E2AD79',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['Brandon Text', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config