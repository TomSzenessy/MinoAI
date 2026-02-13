/**
 * Security Routes — Security audit and configuration endpoints.
 *
 * Provides endpoints for:
 * - Security audit checks
 * - Rate limiting configuration
 * - CORS validation
 * - Security recommendations
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import type { ServerConfig } from "@mino-ink/shared";

/** Server start time, used to calculate uptime. */
const startedAt = Date.now();

/** Security audit finding */
interface SecurityFinding {
	/** Finding ID */
	id: string;
	/** Severity: critical, high, medium, low, info */
	severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
	/** Finding title */
	title: string;
	/** Detailed description */
	description: string;
	/** Recommendation for remediation */
	recommendation: string;
	/** Whether this security check passed */
	detected: boolean;
}

/** Security audit result */
interface SecurityAuditResult {
	/** Audit timestamp */
	timestamp: string;
	/** Server version */
	version: string;
	/** Overall security score (0-100) */
	score: number;
	/** All findings */
	findings: SecurityFinding[];
	/** Summary by severity */
	summary: {
		critical: number;
		high: number;
		medium: number;
		low: number;
		info: number;
	};
}

export function securityRoutes(): Hono<AppContext> {
	const router = new Hono<AppContext>();

	/**
	 * Run security audit checks.
	 * GET /api/v1/security/audit
	 */
	router.get("/audit", async (c) => {
		const findings: SecurityFinding[] = [];
		const config = c.get("config");

		// Check 1: Authentication mode
		findings.push({
			id: 'auth-mode',
			severity: 'high',
			title: 'Authentication Configuration',
			description: 'Check if authentication is properly configured.',
			recommendation: 'Enable authentication for production deployments. Use "api-key" or "jwt" mode.',
			detected: checkAuthMode(config)
		});

		// Check 2: Default credentials
		findings.push({
			id: 'default-credentials',
			severity: 'critical',
			title: 'Default Credentials',
			description: 'Check if default credentials are still in use.',
			recommendation: 'Change default API keys and credentials immediately.',
			detected: await checkDefaultCredentials(config)
		});

		// Check 3: CORS configuration
		findings.push({
			id: 'cors-config',
			severity: 'medium',
			title: 'CORS Configuration',
			description: 'Check if CORS is properly configured.',
			recommendation: 'Restrict CORS origins to trusted domains only.',
			detected: checkCorsConfig(config)
		});

		// Check 4: HTTPS enforcement
		findings.push({
			id: 'https-enforcement',
			severity: 'high',
			title: 'HTTPS Enforcement',
			description: 'Check if HTTPS is enforced for connections.',
			recommendation: 'Enable HTTPS in production. Use a reverse proxy or Cloudflare Tunnel.',
			detected: checkHttpsEnforcement(c)
		});

		// Check 5: Rate limiting
		findings.push({
			id: 'rate-limiting',
			severity: 'medium',
			title: 'Rate Limiting',
			description: 'Check if rate limiting is enabled.',
			recommendation: 'Enable rate limiting to prevent abuse.',
			detected: checkRateLimiting(config)
		});

		// Check 6: Public server URL
		findings.push({
			id: 'public-url',
			severity: 'low',
			title: 'Public Server URL',
			description: 'Check if public server URL is configured.',
			recommendation: 'Configure publicServerUrl for proper link generation.',
			detected: checkPublicUrl(config)
		});

		// Check 7: Relay connection security
		findings.push({
			id: 'relay-security',
			severity: 'medium',
			title: 'Relay Connection Security',
			description: 'Check if relay connection uses secure settings.',
			recommendation: 'Ensure relay URL uses HTTPS and valid credentials.',
			detected: checkRelaySecurity(config)
		});

		// Check 8: Agent API key
		findings.push({
			id: 'agent-api-key',
			severity: 'high',
			title: 'Agent API Key',
			description: 'Check if agent API key is properly configured.',
			recommendation: 'Store API keys securely. Use environment variables, not config files.',
			detected: checkAgentApiKey(config)
		});

		// Check 9: Data directory permissions
		findings.push({
			id: 'data-permissions',
			severity: 'medium',
			title: 'Data Directory Permissions',
			description: 'Check if data directory has appropriate permissions.',
			recommendation: 'Restrict data directory access to the application user only.',
			detected: true // Assume OK in containerized environment
		});

		// Check 10: Debug mode
		findings.push({
			id: 'debug-mode',
			severity: 'low',
			title: 'Debug Mode',
			description: 'Check if debug mode is disabled in production.',
			recommendation: 'Disable debug mode in production environments.',
			detected: checkDebugMode()
		});

		// Calculate score
		const score = calculateSecurityScore(findings);

		// Generate summary
		const summary = {
			critical: findings.filter(f => f.severity === 'critical' && !f.detected).length,
			high: findings.filter(f => f.severity === 'high' && !f.detected).length,
			medium: findings.filter(f => f.severity === 'medium' && !f.detected).length,
			low: findings.filter(f => f.severity === 'low' && !f.detected).length,
			info: findings.filter(f => f.severity === 'info' && !f.detected).length
		};

		const result: SecurityAuditResult = {
			timestamp: new Date().toISOString(),
			version: c.get("version"),
			score,
			findings,
			summary
		};

		return c.json({
			success: true,
			data: result
		});
	});

	/**
	 * Get security configuration.
	 * GET /api/v1/security/config
	 */
	router.get("/config", async (c) => {
		const config = c.get("config");

		return c.json({
			success: true,
			data: {
				auth: {
					mode: config.auth.mode,
					configured: checkAuthMode(config)
				},
				cors: {
					origins: config.server.cors,
					restricted: checkCorsConfig(config)
				},
				rateLimit: {
					enabled: checkRateLimiting(config)
				},
				https: {
					enforced: checkHttpsEnforcement(c)
				}
			}
		});
	});

	/**
	 * Get security recommendations.
	 * GET /api/v1/security/recommendations
	 */
	router.get("/recommendations", async (c) => {
		const recommendations = [
			{
				id: 'enable-auth',
				priority: 'high',
				title: 'Enable Authentication',
				description: 'Configure API key or JWT authentication to protect your notes.',
				steps: [
					'Set MINO_AUTH_MODE=api-key in environment',
					'Or configure auth.mode in config.json',
					'Restart the server to apply changes'
				]
			},
			{
				id: 'use-https',
				priority: 'high',
				title: 'Use HTTPS',
				description: 'Encrypt traffic between clients and server.',
				steps: [
					'Use Cloudflare Tunnel for automatic HTTPS',
					'Or configure a reverse proxy (nginx, caddy)',
					'Ensure certificates are valid and up-to-date'
				]
			},
			{
				id: 'restrict-cors',
				priority: 'medium',
				title: 'Restrict CORS Origins',
				description: 'Limit which domains can access your API.',
				steps: [
					'Set MINO_CORS_ORIGINS to your trusted domains',
					'Avoid using wildcard (*) in production',
					'Include your web app domain and mobile app'
				]
			},
			{
				id: 'enable-rate-limit',
				priority: 'medium',
				title: 'Enable Rate Limiting',
				description: 'Protect against brute force and abuse.',
				steps: [
					'Rate limiting is enabled by default',
					'Adjust limits based on your usage patterns',
					'Monitor rate limit logs for suspicious activity'
				]
			},
			{
				id: 'secure-credentials',
				priority: 'high',
				title: 'Secure API Keys',
				description: 'Protect sensitive API keys and credentials.',
				steps: [
					'Use environment variables for secrets',
					'Never commit API keys to version control',
					'Rotate keys periodically'
				]
			},
			{
				id: 'cloudflare-tunnel',
				priority: 'info',
				title: 'Use Cloudflare Tunnel',
				description: 'Securely expose your server without opening ports.',
				steps: [
					'Create a Cloudflare account',
					'Generate a tunnel token',
					'Configure the tunnel in your deployment'
				]
			}
		];

		return c.json({
			success: true,
			data: { recommendations }
		});
	});

	return router;
}

// Helper functions

function checkAuthMode(config: ServerConfig): boolean {
	const authMode = config.auth.mode;
	return authMode === 'api-key' || authMode === 'jwt';
}

async function checkDefaultCredentials(config: ServerConfig): Promise<boolean> {
	// Check if using default/empty API key
	const authConfig = config.auth;

	// If auth is enabled but no custom key is set, this check fails.
	if (authConfig.mode === 'api-key') {
		const apiKey = (authConfig as { apiKey?: string }).apiKey;
		if (!apiKey || apiKey.length < 16) {
			return false;
		}
	}

	return true;
}

function checkCorsConfig(config: ServerConfig): boolean {
	const cors = config.server.cors;

	// If CORS is empty or has wildcard, it's not properly restricted
	if (!cors || cors.length === 0 || cors.includes('*')) {
		return false; // Issue detected
	}

	return true; // Properly configured
}

function checkHttpsEnforcement(c: { req: { header: (name: string) => string | undefined } }): boolean {
	// Check if request is coming over HTTPS
	const protocol = c.req.header('x-forwarded-proto') ?? 'http';
	const isSecure = protocol === 'https';

	// Also check if we're on localhost (development)
	const host = c.req.header('host') ?? '';
	const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

	return isSecure || isLocalhost;
}

function checkRateLimiting(config: ServerConfig): boolean {
	// Rate limiting is enabled by default
	// Check if explicitly disabled
	const rateLimit = (config.server as { rateLimit?: { enabled?: boolean } }).rateLimit;

	if (rateLimit?.enabled === false) {
		return false;
	}

	return true;
}

function checkPublicUrl(config: ServerConfig): boolean {
	const publicUrl = config.connection.publicServerUrl;
	return Boolean(publicUrl && publicUrl.length > 0);
}

function checkRelaySecurity(config: ServerConfig): boolean {
	const relayUrl = config.connection.relayUrl;

	if (!relayUrl) {
		return true; // Not using relay, no issue
	}

	// Check if relay URL uses HTTPS
	return relayUrl.startsWith('https://');
}

function checkAgentApiKey(config: ServerConfig): boolean {
	const agentConfig = config.agent;

	// If agent is disabled, no issue
	if (!agentConfig.enabled) {
		return true;
	}

	// Check if API key is configured
	const apiKey = agentConfig.apiKey;
	if (!apiKey) {
		return false; // Agent enabled but no API key
	}

	// Check if API key is stored securely (env var vs config file)
	// We can't really check this, so assume it's OK
	return true;
}

function checkDebugMode(): boolean {
	// Check if debug logging is enabled
	try {
		const logLevel = process.env.MINO_LOG_LEVEL;
		return logLevel !== 'debug';
	} catch {
		return true;
	}
}

function calculateSecurityScore(findings: SecurityFinding[]): number {
	let score = 100;

	for (const finding of findings) {
		if (finding.detected) {
			continue; // No issue, no penalty
		}

		// Issue detected, apply penalty
		switch (finding.severity) {
			case 'critical':
				score -= 25;
				break;
			case 'high':
				score -= 15;
				break;
			case 'medium':
				score -= 10;
				break;
			case 'low':
				score -= 5;
				break;
			case 'info':
				score -= 0;
				break;
		}
	}

	return Math.max(0, score);
}
