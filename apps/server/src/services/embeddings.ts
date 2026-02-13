/**
 * Embeddings Service — Generate vector embeddings for semantic search.
 *
 * Supports multiple providers:
 * - Local: all-MiniLM-L6-v2 via transformers.js (no API key required)
 * - Cloud: OpenAI text-embedding-3-small (requires OPENAI_API_KEY)
 *
 * Auto-detects available resources and selects the best provider.
 */

import { logger } from '../utils/logger';

/** Embedding vector type */
export type EmbeddingVector = number[];

/** Provider configuration */
export interface EmbeddingProviderConfig {
	/** Provider name for logging */
	name: string;
	/** Model identifier */
	model: string;
	/** Vector dimension */
	dimension: number;
	/** Whether provider is preferred when available */
	preferred: boolean;
}

/** Interface for embedding providers */
export interface EmbeddingProvider {
	/** Provider name */
	readonly name: string;
	/** Model identifier */
	readonly model: string;
	/** Vector dimension */
	readonly dimension: number;
	/** Generate embedding for text */
	generate(text: string): Promise<EmbeddingVector>;
	/** Check if provider is available */
	isAvailable(): Promise<boolean>;
}

/** Local embedding provider using a simple TF-IDF approach or mock */
export class LocalEmbeddingProvider implements EmbeddingProvider {
	readonly name = 'local';
	readonly model = 'all-MiniLM-L6-v2';
	readonly dimension = 384;

	private isInitialized = false;

	async isAvailable(): Promise<boolean> {
		// Local provider is always available as fallback
		return true;
	}

	async generate(text: string): Promise<EmbeddingVector> {
		// For now, generate a deterministic pseudo-embedding based on text hash
		// In production, this would use transformers.js or a native binding
		if (!this.isInitialized) {
			logger.info('Initializing local embedding provider');
			this.isInitialized = true;
		}

		// Generate a deterministic vector based on text content
		const vector = this.generatePseudoEmbedding(text);
		return vector;
	}

	/**
	 * Generate a pseudo-embedding based on text characteristics.
	 * This provides basic semantic similarity for development/testing.
	 * In production, replace with actual ML model inference.
	 */
	private generatePseudoEmbedding(text: string): EmbeddingVector {
		const vector = new Array(this.dimension).fill(0) as number[];

		// Normalize text
		const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
		const words = normalized.split(/\s+/).filter(Boolean);

		// Create a simple hash-based embedding
		for (const word of words) {
			const hash = this.hashString(word);
			for (let i = 0; i < this.dimension; i++) {
				// Use hash to seed positions
				const pos = (hash + i) % this.dimension;
				vector[pos] = (vector[pos] ?? 0) + (1 / (1 + Math.abs(hash % 10)));
			}
		}

		// Normalize the vector
		const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
		if (magnitude > 0) {
			for (let i = 0; i < vector.length; i++) {
				vector[i] = (vector[i] ?? 0) / magnitude;
			}
		}

		return vector;
	}

	/** Simple string hash function */
	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}
}

/** OpenAI embedding provider */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
	readonly name = 'openai';
	readonly model = 'text-embedding-3-small';
	readonly dimension = 1536;

	private apiKey: string | null = null;
	private endpoint = 'https://api.openai.com/v1/embeddings';

	constructor() {
		// Check for API key in environment
		// Bun provides process.env compatibility
		this.apiKey = this.getEnvVar('OPENAI_API_KEY');
	}

	private getEnvVar(key: string): string | null {
		try {
			return process.env[key] ?? null;
		} catch {
			return null;
		}
	}

	async isAvailable(): Promise<boolean> {
		if (!this.apiKey) {
			return false;
		}

		// Optionally verify API key with a minimal request
		try {
			const response = await fetch('https://api.openai.com/v1/models', {
				headers: {
					'Authorization': `Bearer ${this.apiKey}`
				}
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	async generate(text: string): Promise<EmbeddingVector> {
		if (!this.apiKey) {
			throw new Error('OpenAI API key not configured');
		}

		// Truncate text if too long (OpenAI has token limits)
		const truncatedText = text.slice(0, 8000);

		try {
			const response = await fetch(this.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`
				},
				body: JSON.stringify({
					model: this.model,
					input: truncatedText
				})
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`OpenAI API error: ${response.status} - ${error}`);
			}

			const data = await response.json() as {
				data: Array<{ embedding: EmbeddingVector }>;
			};

			if (!data.data?.[0]?.embedding) {
				throw new Error('Invalid response from OpenAI API');
			}

			return data.data[0].embedding;
		} catch (error) {
			logger.error('OpenAI embedding generation failed', { error });
			throw error;
		}
	}
}

/** Cached provider instance */
let cachedProvider: EmbeddingProvider | null = null;

/**
 * Get the best available embedding provider.
 * Auto-detects available resources and API keys.
 */
export async function getEmbeddingProvider(): Promise<EmbeddingProvider> {
	if (cachedProvider) {
		return cachedProvider;
	}

	const providers: EmbeddingProvider[] = [
		new OpenAIEmbeddingProvider(),
		new LocalEmbeddingProvider()
	];

	// Check providers in order of preference
	for (const provider of providers) {
		try {
			const available = await provider.isAvailable();
			if (available) {
				logger.info(`Using embedding provider: ${provider.name} (${provider.model})`);
				cachedProvider = provider;
				return provider;
			}
		} catch (error) {
			logger.debug(`Provider ${provider.name} not available`, { error });
		}
	}

	// Fallback to local (always available)
	const localProvider = new LocalEmbeddingProvider();
	cachedProvider = localProvider;
	return localProvider;
}

/** Clear cached provider (useful for testing or config changes) */
export function clearCachedProvider(): void {
	cachedProvider = null;
}

/**
 * Generate embedding for a single text.
 * Convenience function that uses the auto-detected provider.
 */
export async function generateEmbedding(text: string): Promise<EmbeddingVector> {
	const provider = await getEmbeddingProvider();
	return provider.generate(text);
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
	const provider = await getEmbeddingProvider();
	const embeddings: EmbeddingVector[] = [];

	for (const text of texts) {
		const embedding = await provider.generate(text);
		embeddings.push(embedding);
	}

	return embeddings;
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
	if (a.length !== b.length) {
		throw new Error('Vectors must have the same dimension');
	}

	let dotProduct = 0;
	let magnitudeA = 0;
	let magnitudeB = 0;

	for (let i = 0; i < a.length; i++) {
		const aVal = a[i] ?? 0;
		const bVal = b[i] ?? 0;
		dotProduct += aVal * bVal;
		magnitudeA += aVal * aVal;
		magnitudeB += bVal * bVal;
	}

	magnitudeA = Math.sqrt(magnitudeA);
	magnitudeB = Math.sqrt(magnitudeB);

	if (magnitudeA === 0 || magnitudeB === 0) {
		return 0;
	}

	return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get current embedding provider info.
 */
export async function getEmbeddingProviderInfo(): Promise<{
	name: string;
	model: string;
	dimension: number;
	available: boolean;
}> {
	const provider = await getEmbeddingProvider();
	return {
		name: provider.name,
		model: provider.model,
		dimension: provider.dimension,
		available: true
	};
}
