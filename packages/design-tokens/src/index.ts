/**
 * @mino-ink/design-tokens — Design tokens for the Mino platform.
 *
 * This package exports:
 * - CSS custom properties (tokens.css)
 * - Tailwind CSS preset (tailwind.preset.ts)
 * - TypeScript token values for programmatic use
 */

// Export token values for programmatic use
export const tokens = {
	colors: {
		bg: {
			base: '#121212',
			surface: '#1e1e1e',
			elevated: '#2a2a2a',
			hover: '#353535',
			active: '#404040'
		},
		purple: {
			50: '#f5f0ff',
			100: '#e8dbff',
			200: '#d4bfff',
			300: '#c4a6fe',
			400: '#bb86fc', // Brand primary
			500: '#a96ef5',
			600: '#9b5de5',
			700: '#7e3fcc',
			800: '#6229a8',
			900: '#481985',
			950: '#2d0f54'
		},
		text: {
			primary: 'rgba(255, 255, 255, 1)',
			secondary: 'rgba(255, 255, 255, 0.6)',
			tertiary: 'rgba(255, 255, 255, 0.4)',
			muted: 'rgba(255, 255, 255, 0.2)'
		},
		semantic: {
			success: '#22c55e',
			warning: '#eab308',
			error: '#ef4444',
			info: '#3b82f6'
		}
	},
	fonts: {
		display: '"Space Grotesk", system-ui, sans-serif',
		body: '"Inter", system-ui, sans-serif',
		mono: '"JetBrains Mono", "Fira Code", monospace'
	},
	spacing: {
		1: '4px',
		2: '8px',
		3: '12px',
		4: '16px',
		5: '20px',
		6: '24px',
		8: '32px',
		10: '40px',
		12: '48px',
		16: '64px'
	},
	radius: {
		sm: '6px',
		md: '10px',
		lg: '16px',
		xl: '20px',
		'2xl': '28px',
		full: '9999px'
	},
	shadows: {
		sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
		md: '0 4px 6px rgba(0, 0, 0, 0.3)',
		lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
		xl: '0 20px 25px rgba(0, 0, 0, 0.4)',
		glow: '0 0 30px -5px rgba(187, 134, 252, 0.35)',
		glowLg: '0 0 60px -10px rgba(187, 134, 252, 0.25)'
	},
	transitions: {
		fast: '150ms ease-out',
		base: '300ms ease-out',
		slow: '500ms ease-out'
	},
	layout: {
		sidebarWidth: '260px',
		sidebarCollapsedWidth: '60px',
		editorMaxWidth: '800px'
	}
} as const;

// Export types for token values
export type MinoColors = typeof tokens.colors;
export type MinoPurple = typeof tokens.colors.purple;
export type MinoSpacing = typeof tokens.spacing;
export type MinoRadius = typeof tokens.radius;

// Brand color constant
export const BRAND_PURPLE = '#bb86fc' as const;
export const BRAND_BG = '#1e1e1e' as const;

// CSS variable names for reference
export const cssVariables = {
	bgBase: '--mino-bg-base',
	bgSurface: '--mino-bg-surface',
	bgElevated: '--mino-bg-elevated',
	purple400: '--mino-purple-400',
	purple600: '--mino-purple-600',
	textPrimary: '--mino-text-primary',
	textSecondary: '--mino-text-secondary',
	glassBg: '--mino-glass-bg',
	glassBorder: '--mino-glass-border',
	glow: '--mino-glow'
} as const;

export default tokens;
