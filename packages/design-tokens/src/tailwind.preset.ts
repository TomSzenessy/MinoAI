/**
 * Mino Tailwind CSS Preset
 *
 * Extends Tailwind with the Mino design system tokens.
 * Import via: tailwind.config.ts -> import minoPreset from "@mino-ink/design-tokens/tailwind";
 *
 * @example
 * // tailwind.config.ts
 * import minoPreset from "@mino-ink/design-tokens/tailwind";
 * export default {
 *   presets: [minoPreset],
 *   // your custom config
 * };
 */

import type { Config } from 'tailwindcss';

const minoPreset: Config = {
	content: [],
	darkMode: ['class', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				// Background scale
				mino: {
					bg: {
						base: 'var(--mino-bg-base)',
						surface: 'var(--mino-bg-surface)',
						elevated: 'var(--mino-bg-elevated)',
						hover: 'var(--mino-bg-hover)',
						active: 'var(--mino-bg-active)'
					},
					// Purple accent scale
					purple: {
						50: 'var(--mino-purple-50)',
						100: 'var(--mino-purple-100)',
						200: 'var(--mino-purple-200)',
						300: 'var(--mino-purple-300)',
						400: 'var(--mino-purple-400)',
						500: 'var(--mino-purple-500)',
						600: 'var(--mino-purple-600)',
						700: 'var(--mino-purple-700)',
						800: 'var(--mino-purple-800)',
						900: 'var(--mino-purple-900)',
						950: 'var(--mino-purple-950)'
					},
					// Text colors
					text: {
						primary: 'var(--mino-text-primary)',
						secondary: 'var(--mino-text-secondary)',
						tertiary: 'var(--mino-text-tertiary)',
						muted: 'var(--mino-text-muted)'
					},
					// Semantic colors
					success: 'var(--mino-success)',
					warning: 'var(--mino-warning)',
					error: 'var(--mino-error)',
					info: 'var(--mino-info)',
					// Glass
					glass: {
						bg: 'var(--mino-glass-bg)',
						border: 'var(--mino-glass-border)'
					}
				}
			},
			fontFamily: {
				display: [
					'var(--mino-font-display)',
					'system-ui',
					'sans-serif'
				],
				body: ['var(--mino-font-body)', 'system-ui', 'sans-serif'],
				mono: ['var(--mino-font-mono)', 'monospace']
			},
			fontSize: {
				xs: [
					'var(--mino-text-xs)',
					{ lineHeight: 'var(--mino-leading-normal)' }
				],
				sm: [
					'var(--mino-text-sm)',
					{ lineHeight: 'var(--mino-leading-normal)' }
				],
				base: [
					'var(--mino-text-base)',
					{ lineHeight: 'var(--mino-leading-normal)' }
				],
				lg: [
					'var(--mino-text-lg)',
					{ lineHeight: 'var(--mino-leading-normal)' }
				],
				xl: [
					'var(--mino-text-xl)',
					{ lineHeight: 'var(--mino-leading-tight)' }
				],
				'2xl': [
					'var(--mino-text-2xl)',
					{ lineHeight: 'var(--mino-leading-tight)' }
				],
				'3xl': [
					'var(--mino-text-3xl)',
					{ lineHeight: 'var(--mino-leading-tight)' }
				],
				'4xl': [
					'var(--mino-text-4xl)',
					{ lineHeight: 'var(--mino-leading-tight)' }
				]
			},
			spacing: {
				1: 'var(--mino-space-1)',
				2: 'var(--mino-space-2)',
				3: 'var(--mino-space-3)',
				4: 'var(--mino-space-4)',
				5: 'var(--mino-space-5)',
				6: 'var(--mino-space-6)',
				8: 'var(--mino-space-8)',
				10: 'var(--mino-space-10)',
				12: 'var(--mino-space-12)',
				16: 'var(--mino-space-16)'
			},
			borderRadius: {
				sm: 'var(--mino-radius-sm)',
				md: 'var(--mino-radius-md)',
				lg: 'var(--mino-radius-lg)',
				xl: 'var(--mino-radius-xl)',
				'2xl': 'var(--mino-radius-2xl)',
				full: 'var(--mino-radius-full)'
			},
			boxShadow: {
				sm: 'var(--mino-shadow-sm)',
				md: 'var(--mino-shadow-md)',
				lg: 'var(--mino-shadow-lg)',
				xl: 'var(--mino-shadow-xl)',
				glow: 'var(--mino-glow)',
				'glow-lg': 'var(--mino-glow-lg)',
				'glow-sm': 'var(--mino-glow-sm)',
				focus: 'var(--mino-glow-focus)'
			},
			backdropBlur: {
				glass: 'var(--mino-glass-blur)',
				'glass-sm': 'var(--mino-glass-blur-sm)',
				'glass-lg': 'var(--mino-glass-blur-lg)'
			},
			transitionDuration: {
				fast: 'var(--mino-transition-fast)',
				base: 'var(--mino-transition-base)',
				slow: 'var(--mino-transition-slow)'
			},
			zIndex: {
				dropdown: 'var(--mino-z-dropdown)',
				sticky: 'var(--mino-z-sticky)',
				fixed: 'var(--mino-z-fixed)',
				'modal-backdrop': 'var(--mino-z-modal-backdrop)',
				modal: 'var(--mino-z-modal)',
				popover: 'var(--mino-z-popover)',
				tooltip: 'var(--mino-z-tooltip)',
				toast: 'var(--mino-z-toast)'
			},
			width: {
				sidebar: 'var(--mino-sidebar-width)',
				'sidebar-collapsed': 'var(--mino-sidebar-collapsed-width)',
				'editor-max': 'var(--mino-editor-max-width)'
			},
			maxWidth: {
				editor: 'var(--mino-editor-max-width)'
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'slide-down': 'slideDown 0.3s ease-out',
				'scale-in': 'scaleIn 0.2s ease-out',
				'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideDown: {
					'0%': { opacity: '0', transform: 'translateY(-10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				pulseGlow: {
					'0%, 100%': { boxShadow: 'var(--mino-glow)' },
					'50%': { boxShadow: 'var(--mino-glow-lg)' }
				}
			}
		}
	},
	plugins: []
};

export default minoPreset;
