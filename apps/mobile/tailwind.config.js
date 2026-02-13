/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Background scale (dark mode)
				mino: {
					bg: {
						base: '#121212',
						surface: '#1E1E1E',
						elevated: '#2A2A2A',
						hover: '#353535',
						active: '#404040'
					},
					// Purple accent scale
					purple: {
						50: '#F5F0FF',
						100: '#E8DBFF',
						200: '#D4BFFF',
						300: '#C4A6FE',
						400: '#BB86FC', // Brand primary
						500: '#A96EF5',
						600: '#9B5DE5',
						700: '#7E3FCC',
						800: '#6229A8',
						900: '#481985',
						950: '#2D0F54'
					},
					// Text colors
					text: {
						primary: 'rgba(255, 255, 255, 1.0)',
						secondary: 'rgba(255, 255, 255, 0.6)',
						tertiary: 'rgba(255, 255, 255, 0.4)',
						muted: 'rgba(255, 255, 255, 0.2)'
					},
					// Semantic colors
					success: '#22C55E',
					warning: '#EAB308',
					error: '#EF4444',
					info: '#3B82F6'
				}
			},
			fontFamily: {
				display: ['SpaceGrotesk', 'system-ui', 'sans-serif'],
				body: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrainsMono', 'FiraCode', 'monospace']
			},
			borderRadius: {
				sm: '6px',
				md: '10px',
				lg: '16px',
				xl: '20px',
				'2xl': '28px'
			},
			boxShadow: {
				sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
				md: '0 4px 6px rgba(0, 0, 0, 0.3)',
				lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
				xl: '0 20px 25px rgba(0, 0, 0, 0.4)',
				glow: '0 0 30px -5px rgba(187, 134, 252, 0.35)',
				'glow-lg': '0 0 60px -10px rgba(187, 134, 252, 0.25)'
			}
		}
	},
	plugins: []
};
