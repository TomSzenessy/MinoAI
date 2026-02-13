/**
 * OpenAPI Specification — Auto-generated API documentation.
 *
 * This module generates an OpenAPI 3.1 specification from the Hono routes.
 * The spec is exposed at /api/v1/openapi.json for tooling consumption.
 *
 * Features:
 * - Route metadata extraction
 * - Schema generation from TypeScript types
 * - Interactive docs via Swagger UI at /docs
 */

import { Hono } from 'hono';
import type { AppContext } from './types';

/** OpenAPI 3.1 specification structure. */
export interface OpenAPISpec {
	openapi: '3.1.0';
	info: {
		title: string;
		version: string;
		description?: string;
		license?: { name: string; url?: string };
	};
	servers?: Array<{ url: string; description?: string }>;
	paths: Record<string, Record<string, PathItem>>;
	components?: {
		schemas?: Record<string, SchemaObject>;
		securitySchemes?: Record<string, SecuritySchemeObject>;
	};
	tags?: Array<{ name: string; description?: string }>;
}

/** A single API endpoint definition. */
export interface PathItem {
	summary?: string;
	description?: string;
	operationId?: string;
	tags?: string[];
	parameters?: ParameterObject[];
	requestBody?: RequestBodyObject;
	responses: Record<string, ResponseObject>;
	security?: Array<Record<string, string[]>>;
	deprecated?: boolean;
}

/** Parameter definition. */
export interface ParameterObject {
	name: string;
	in: 'query' | 'header' | 'path' | 'cookie';
	required?: boolean;
	description?: string;
	schema: SchemaObject;
}

/** Request body definition. */
export interface RequestBodyObject {
	description?: string;
	required?: boolean;
	content: Record<string, { schema: SchemaObject | { $ref: string } }>;
}

/** Response definition. */
export interface ResponseObject {
	description: string;
	content?: Record<string, { schema: SchemaObject | { $ref: string } }>;
}

/** Schema object (simplified). */
export interface SchemaObject {
	type?: string;
	format?: string;
	description?: string;
	required?: string[];
	properties?: Record<string, SchemaObject>;
	items?: SchemaObject;
	enum?: (string | number | boolean)[];
	default?: unknown;
	example?: unknown;
	nullable?: boolean;
	additionalProperties?: boolean | SchemaObject;
	$ref?: string;
}

/** Security scheme definition. */
export interface SecuritySchemeObject {
	type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
	description?: string;
	name?: string;
	in?: 'query' | 'header' | 'cookie';
	scheme?: string;
	bearerFormat?: string;
}

/** Options for spec generation. */
export interface OpenAPIOptions {
	/** API title. */
	title?: string;
	/** API version. */
	version?: string;
	/** API description. */
	description?: string;
	/** Server URLs. */
	servers?: Array<{ url: string; description?: string }>;
}

/** Common schema definitions used across the API. */
const commonSchemas: Record<string, SchemaObject> = {
	Error: {
		type: 'object',
		required: ['success', 'error'],
		properties: {
			success: { type: 'boolean', enum: [false] },
			error: {
				type: 'object',
				required: ['code', 'message'],
				properties: {
					code: {
						type: 'string',
						description: 'Machine-readable error code'
					},
					message: {
						type: 'string',
						description: 'Human-readable error message'
					},
					details: {
						type: 'object',
						description: 'Additional error details'
					}
				}
			}
		}
	},
	Note: {
		type: 'object',
		required: ['path', 'title', 'content', 'checksum'],
		properties: {
			path: {
				type: 'string',
				description: 'Relative path from notes root'
			},
			title: { type: 'string', description: 'Note title' },
			content: { type: 'string', description: 'Markdown content' },
			tags: {
				type: 'array',
				items: { type: 'string' },
				description: 'Tags from frontmatter'
			},
			links: {
				type: 'array',
				items: { type: 'string' },
				description: 'Internal links'
			},
			backlinks: {
				type: 'array',
				items: { type: 'string' },
				description: 'Notes linking to this one'
			},
			wordCount: { type: 'integer', description: 'Word count' },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
			checksum: { type: 'string', description: 'SHA-256 hash' },
			frontmatter: {
				type: 'object',
				description: 'Parsed YAML frontmatter',
				additionalProperties: true
			}
		}
	},
	NoteMetadata: {
		type: 'object',
		required: ['path', 'title', 'checksum'],
		properties: {
			path: { type: 'string' },
			title: { type: 'string' },
			tags: { type: 'array', items: { type: 'string' } },
			links: { type: 'array', items: { type: 'string' } },
			backlinks: { type: 'array', items: { type: 'string' } },
			wordCount: { type: 'integer' },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
			checksum: { type: 'string' }
		}
	},
	SearchResult: {
		type: 'object',
		required: ['path', 'title', 'snippet', 'score'],
		properties: {
			path: { type: 'string' },
			title: { type: 'string' },
			snippet: {
				type: 'string',
				description: 'Content snippet around match'
			},
			score: { type: 'number', description: 'Relevance score' },
			tags: { type: 'array', items: { type: 'string' } }
		}
	},
	FolderNode: {
		type: 'object',
		required: ['name', 'path', 'isDirectory'],
		properties: {
			name: { type: 'string' },
			path: { type: 'string' },
			isDirectory: { type: 'boolean' },
			fileCount: { type: 'integer' },
			children: {
				type: 'array',
				items: { $ref: '#/components/schemas/FolderNode' }
			}
		}
	},
	Credentials: {
		type: 'object',
		required: ['serverId', 'adminApiKey'],
		properties: {
			serverId: { type: 'string', format: 'uuid' },
			adminApiKey: { type: 'string', description: 'mino_sk_...' },
			setupComplete: { type: 'boolean' },
			createdAt: { type: 'string', format: 'date-time' }
		}
	},
	SystemCapabilities: {
		type: 'object',
		properties: {
			localWhisper: { type: 'boolean' },
			localOCR: { type: 'boolean' },
			localEmbeddings: { type: 'boolean' },
			localLLM: { type: 'boolean' },
			sandbox: { type: 'boolean' },
			maxConcurrentRequests: { type: 'integer' }
		}
	},
	HealthStatus: {
		type: 'object',
		required: ['status', 'version'],
		properties: {
			status: { type: 'string', enum: ['ok', 'degraded'] },
			version: { type: 'string' },
			uptimeSeconds: { type: 'number' },
			noteCount: { type: 'integer' },
			lastIndexedAt: {
				type: 'string',
				format: 'date-time',
				nullable: true
			}
		}
	},
	PluginManifest: {
		type: 'object',
		required: ['id', 'name', 'version'],
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			version: { type: 'string' },
			description: { type: 'string' },
			author: { type: 'string' },
			enabled: { type: 'boolean' },
			installed: { type: 'boolean' }
		}
	},
	ChannelConfig: {
		type: 'object',
		required: ['id', 'provider'],
		properties: {
			id: { type: 'string' },
			provider: { type: 'string', enum: ['telegram', 'whatsapp'] },
			name: { type: 'string' },
			enabled: { type: 'boolean' },
			createdAt: { type: 'string', format: 'date-time' }
		}
	}
};

/** API paths definition. */
const apiPaths: Record<string, Record<string, PathItem>> = {
	'/api/v1/health': {
		get: {
			summary: 'Health check',
			description: 'Returns basic server health status',
			tags: ['system'],
			responses: {
				'200': {
					description: 'Server is healthy',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/HealthStatus'
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/health/detailed': {
		get: {
			summary: 'Detailed health check',
			description: 'Returns detailed server health with resource info',
			tags: ['system'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Detailed health status',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										$ref: '#/components/schemas/HealthStatus'
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/system/setup': {
		get: {
			summary: 'Get setup credentials',
			description:
				'Returns auto-generated credentials for first-time setup',
			tags: ['system'],
			responses: {
				'200': {
					description: 'Setup credentials',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										$ref: '#/components/schemas/Credentials'
									}
								}
							}
						}
					}
				},
				'403': {
					description: 'Setup already complete',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Error' }
						}
					}
				}
			}
		}
	},
	'/api/v1/system/info': {
		get: {
			summary: 'Get server info',
			description: 'Returns server identity and version',
			tags: ['system'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Server info',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'object',
										properties: {
											serverId: { type: 'string' },
											version: { type: 'string' },
											setupComplete: { type: 'boolean' }
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/system/capabilities': {
		get: {
			summary: 'Get system capabilities',
			description: 'Returns detected system resources and capabilities',
			tags: ['system'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'System capabilities',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										$ref: '#/components/schemas/SystemCapabilities'
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/notes': {
		get: {
			summary: 'List all notes',
			description: 'Returns metadata for all notes',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'List of notes',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'array',
										items: {
											$ref: '#/components/schemas/NoteMetadata'
										}
									}
								}
							}
						}
					}
				}
			}
		},
		post: {
			summary: 'Create a note',
			description: 'Creates a new note at the specified path',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['path', 'content'],
							properties: {
								path: {
									type: 'string',
									description: 'Relative path for the note'
								},
								content: {
									type: 'string',
									description: 'Markdown content'
								}
							}
						}
					}
				}
			},
			responses: {
				'201': {
					description: 'Note created',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: { $ref: '#/components/schemas/Note' }
								}
							}
						}
					}
				},
				'409': {
					description: 'Note already exists',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Error' }
						}
					}
				}
			}
		}
	},
	'/api/v1/notes/{path}': {
		get: {
			summary: 'Get a note',
			description: 'Returns a single note with full content',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			parameters: [
				{
					name: 'path',
					in: 'path',
					required: true,
					description: 'Note path (URL-encoded)',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Note content',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: { $ref: '#/components/schemas/Note' }
								}
							}
						}
					}
				},
				'404': {
					description: 'Note not found',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Error' }
						}
					}
				}
			}
		},
		put: {
			summary: 'Update a note',
			description: 'Replaces the content of an existing note',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			parameters: [
				{
					name: 'path',
					in: 'path',
					required: true,
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['content'],
							properties: {
								content: { type: 'string' }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Note updated',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: { $ref: '#/components/schemas/Note' }
								}
							}
						}
					}
				},
				'404': {
					description: 'Note not found',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Error' }
						}
					}
				}
			}
		},
		delete: {
			summary: 'Delete a note',
			description: 'Permanently deletes a note',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			parameters: [
				{
					name: 'path',
					in: 'path',
					required: true,
					schema: { type: 'string' }
				}
			],
			responses: {
				'204': { description: 'Note deleted' },
				'404': {
					description: 'Note not found',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Error' }
						}
					}
				}
			}
		}
	},
	'/api/v1/notes/{path}/move': {
		patch: {
			summary: 'Move a note',
			description: 'Moves a note to a new path',
			tags: ['notes'],
			security: [{ ApiKeyAuth: [] }],
			parameters: [
				{
					name: 'path',
					in: 'path',
					required: true,
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['path'],
								properties: {
									path: {
										type: 'string',
										description: 'Target path'
									}
								}
							}
					}
				}
			},
			responses: {
				'200': {
					description: 'Note moved',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: { $ref: '#/components/schemas/Note' }
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/tree': {
		get: {
			summary: 'Get folder tree',
			description: 'Returns the hierarchical folder structure',
			tags: ['folders'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Folder tree',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'object',
										properties: {
											root: {
												$ref: '#/components/schemas/FolderNode'
											},
											totalFiles: { type: 'integer' }
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/search': {
		get: {
			summary: 'Search notes',
			description: 'Full-text search across all notes using FTS5',
			tags: ['search'],
			security: [{ ApiKeyAuth: [] }],
			parameters: [
				{
					name: 'q',
					in: 'query',
					required: true,
					description: 'Search query',
					schema: { type: 'string' }
				},
				{
					name: 'limit',
					in: 'query',
					description: 'Maximum results (default: 20, max: 100)',
					schema: { type: 'integer', default: 20 }
				},
				{
					name: 'folder',
					in: 'query',
					description: 'Filter by folder path',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Search results',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'array',
										items: {
											$ref: '#/components/schemas/SearchResult'
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/plugins': {
		get: {
			summary: 'List installed plugins',
			tags: ['plugins'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Installed plugins',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'array',
										items: {
											$ref: '#/components/schemas/PluginManifest'
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
		'/api/v1/plugins/catalog': {
			get: {
				summary: 'Browse plugin catalog',
				tags: ['plugins'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Available plugins',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'array',
										items: {
											$ref: '#/components/schemas/PluginManifest'
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/plugins/install': {
		post: {
			summary: 'Install a plugin',
			tags: ['plugins'],
			security: [{ ApiKeyAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['id'],
							properties: {
								id: {
									type: 'string',
									description: 'Plugin ID to install'
								}
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Plugin installed',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										$ref: '#/components/schemas/PluginManifest'
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/agent/chat': {
		post: {
			summary: 'Chat with AI agent',
			description: 'Send a message to the AI agent and get a response',
			tags: ['agent'],
			security: [{ ApiKeyAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['message'],
							properties: {
								message: {
									type: 'string',
									description: 'User message'
								},
								conversationId: {
									type: 'string',
									description: 'Conversation ID for context'
								}
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Agent response',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'object',
										properties: {
											response: { type: 'string' },
											conversationId: { type: 'string' },
											toolCalls: {
												type: 'array',
												items: {
													type: 'object',
													properties: {
														tool: {
															type: 'string'
														},
														args: {
															type: 'object'
														},
														result: {
															type: 'object'
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	'/api/v1/channels': {
		get: {
			summary: 'List channels',
			tags: ['channels'],
			security: [{ ApiKeyAuth: [] }],
			responses: {
				'200': {
					description: 'Channel list',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										type: 'array',
										items: {
											$ref: '#/components/schemas/ChannelConfig'
										}
									}
								}
							}
						}
					}
				}
			}
		},
		post: {
			summary: 'Create a channel',
			tags: ['channels'],
			security: [{ ApiKeyAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['provider'],
							properties: {
								provider: {
									type: 'string',
									enum: ['telegram', 'whatsapp']
								},
								name: { type: 'string' },
								config: { type: 'object' }
							}
						}
					}
				}
			},
			responses: {
				'201': {
					description: 'Channel created',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean' },
									data: {
										$ref: '#/components/schemas/ChannelConfig'
									}
								}
							}
						}
					}
				}
			}
		}
	}
};

/**
 * Generates the complete OpenAPI specification.
 */
export function generateOpenAPISpec(options: OpenAPIOptions = {}): OpenAPISpec {
	return {
		openapi: '3.1.0',
		info: {
			title: options.title ?? 'Mino API',
			version: options.version ?? '1.0.0',
			description:
				options.description ?? 'AI-native knowledge management API',
			license: {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT'
			}
		},
		servers: options.servers ?? [
			{ url: 'http://localhost:3000', description: 'Local development' }
		],
		paths: apiPaths,
		components: {
			schemas: commonSchemas,
			securitySchemes: {
					ApiKeyAuth: {
						type: 'apiKey',
						in: 'header',
						name: 'X-Mino-Key',
						description: 'API key authentication (mino_sk_...)'
					}
				}
			},
		tags: [
			{ name: 'system', description: 'System information and health' },
			{ name: 'notes', description: 'Note CRUD operations' },
			{ name: 'folders', description: 'Folder management' },
			{ name: 'search', description: 'Full-text search' },
			{ name: 'plugins', description: 'Plugin management' },
			{ name: 'agent', description: 'AI agent interactions' },
			{ name: 'channels', description: 'Communication channels' }
		]
	};
}

/**
 * Creates a route handler for serving the OpenAPI spec.
 */
export function createOpenAPIRoutes(): Hono<AppContext> {
	const router = new Hono<AppContext>();

	const spec = generateOpenAPISpec();

	router.get('/openapi.json', (c) => {
		return c.json(spec);
	});

	// Simple Swagger UI HTML
	router.get('/docs', (c) => {
		const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mino API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>body { margin: 0; background: #1e1e1e; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/v1/openapi.json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        theme: { 
          palette: {
            primary: { main: '#bb86fc' }
          }
        }
      })
    }
  </script>
</body>
</html>`;
		return c.html(html);
	});

	return router;
}
