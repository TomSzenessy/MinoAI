/**
 * Mino Typography Tokens
 * Display: Space Grotesk, Body: Inter, Code: JetBrains Mono
 */

import { Platform, TextStyle } from 'react-native';

// Font family names
export const fontFamilies = {
	display: Platform.select({
		ios: 'Space Grotesk',
		android: 'SpaceGrotesk',
		default: 'system-ui'
	}),
	body: Platform.select({
		ios: 'Inter',
		android: 'Inter',
		default: 'system-ui'
	}),
	mono: Platform.select({
		ios: 'JetBrains Mono',
		android: 'JetBrainsMono',
		default: 'monospace'
	})
};

// Font sizes
export const fontSizes = {
	xs: 10,
	sm: 12,
	base: 14,
	md: 16,
	lg: 18,
	xl: 20,
	'2xl': 24,
	'3xl': 30,
	'4xl': 36,
	'5xl': 48
} as const;

// Font weights
export const fontWeights = {
	normal: '400' as const,
	medium: '500' as const,
	semibold: '600' as const,
	bold: '700' as const
} as const;

// Line heights
export const lineHeights = {
	tight: 1.2,
	normal: 1.5,
	relaxed: 1.75
} as const;

// Pre-defined text styles
export const textStyles: Record<string, TextStyle> = {
	// Display / Headings
	display: {
		fontFamily: fontFamilies.display,
		fontWeight: '700',
		lineHeight: fontSizes['5xl'] * lineHeights.tight,
		fontSize: fontSizes['5xl']
	},
	h1: {
		fontFamily: fontFamilies.display,
		fontWeight: '700',
		lineHeight: fontSizes['4xl'] * lineHeights.tight,
		fontSize: fontSizes['4xl']
	},
	h2: {
		fontFamily: fontFamilies.display,
		fontWeight: '600',
		lineHeight: fontSizes['3xl'] * lineHeights.tight,
		fontSize: fontSizes['3xl']
	},
	h3: {
		fontFamily: fontFamilies.display,
		fontWeight: '600',
		lineHeight: fontSizes['2xl'] * lineHeights.tight,
		fontSize: fontSizes['2xl']
	},
	h4: {
		fontFamily: fontFamilies.display,
		fontWeight: '600',
		lineHeight: fontSizes.xl * lineHeights.tight,
		fontSize: fontSizes.xl
	},

	// Body text
	body: {
		fontFamily: fontFamilies.body,
		fontWeight: '400',
		lineHeight: fontSizes.md * lineHeights.normal,
		fontSize: fontSizes.md
	},
	bodyLarge: {
		fontFamily: fontFamilies.body,
		fontWeight: '400',
		lineHeight: fontSizes.lg * lineHeights.normal,
		fontSize: fontSizes.lg
	},
	bodySmall: {
		fontFamily: fontFamilies.body,
		fontWeight: '400',
		lineHeight: fontSizes.base * lineHeights.normal,
		fontSize: fontSizes.base
	},

	// UI text
	label: {
		fontFamily: fontFamilies.body,
		fontWeight: '500',
		lineHeight: fontSizes.sm * lineHeights.normal,
		fontSize: fontSizes.sm
	},
	caption: {
		fontFamily: fontFamilies.body,
		fontWeight: '400',
		lineHeight: fontSizes.xs * lineHeights.normal,
		fontSize: fontSizes.xs
	},

	// Code
	code: {
		fontFamily: fontFamilies.mono,
		fontWeight: '400',
		lineHeight: fontSizes.base * lineHeights.normal,
		fontSize: fontSizes.base
	},
	codeSmall: {
		fontFamily: fontFamilies.mono,
		fontWeight: '400',
		lineHeight: fontSizes.sm * lineHeights.normal,
		fontSize: fontSizes.sm
	}
};

export default textStyles;
