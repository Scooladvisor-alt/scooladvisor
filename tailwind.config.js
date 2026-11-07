/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			heading: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
  			body: ['Instrument Sans', 'system-ui', 'sans-serif'],
  			hand: ['Caveat', 'cursive']
  		},
  		boxShadow: {
  			hard: '6px 6px 0 hsl(var(--ink) / 0.12)',
  			'hard-lg': '9px 9px 0 hsl(var(--ink) / 0.18)',
  			'hard-ink': '3px 3px 0 hsl(var(--ink) / 0.85)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 6px)',
  			sm: 'calc(var(--radius) - 10px)'
  		},
  		colors: {
  			pink: {
  				50: 'hsl(var(--pen-red) / 0.07)', 100: 'hsl(var(--pen-red) / 0.12)', 200: 'hsl(var(--pen-red) / 0.25)',
  				300: 'hsl(var(--pen-red) / 0.45)', 400: 'hsl(var(--pen-red))', 500: 'hsl(var(--pen-red))',
  				600: 'hsl(var(--pen-red))', 700: 'hsl(var(--pen-red))', 800: 'hsl(var(--pen-red))', 900: 'hsl(var(--pen-red))', 950: 'hsl(var(--pen-red))'
  			},
  			purple: {
  				50: 'hsl(var(--ink) / 0.05)', 100: 'hsl(var(--ink) / 0.09)', 200: 'hsl(var(--ink) / 0.18)',
  				300: 'hsl(var(--ink) / 0.35)', 400: 'hsl(var(--ink) / 0.7)', 500: 'hsl(var(--ink))',
  				600: 'hsl(var(--ink))', 700: 'hsl(var(--ink))', 800: 'hsl(var(--ink))', 900: 'hsl(var(--ink))', 950: 'hsl(var(--ink))'
  			},
  			blue: {
  				50: 'hsl(var(--ink) / 0.05)', 100: 'hsl(var(--ink) / 0.09)', 200: 'hsl(var(--ink) / 0.18)',
  				300: 'hsl(var(--ink) / 0.35)', 400: 'hsl(var(--ink) / 0.7)', 500: 'hsl(var(--ink))',
  				600: 'hsl(var(--ink))', 700: 'hsl(var(--ink))', 800: 'hsl(var(--ink))', 900: 'hsl(var(--ink))', 950: 'hsl(var(--ink))'
  			},
  			cream: 'hsl(var(--cream))',
  			ink: 'hsl(var(--ink))',
  			pen: 'hsl(var(--pen-red))',
  			highlight: 'hsl(var(--highlight))',
  			'grade-high': 'hsl(var(--grade-high))',
  			'grade-mid': 'hsl(var(--grade-mid))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}