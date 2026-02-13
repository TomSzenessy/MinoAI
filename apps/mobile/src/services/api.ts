/**
 * API Service
 * Wrapper around @mino-ink/api-client for mobile use
 */

import { MinoClient, MinoError } from '@mino-ink/api-client';
import type { ServerConnection } from '@/types';
import * as storage from './storage';

let client: MinoClient | null = null;

/**
 * Initialize the API client
 */
export function initClient(connection: ServerConnection): MinoClient {
  client = new MinoClient({
    serverUrl: connection.url,
    apiKey: connection.apiKey,
    timeout: 30000,
  });
  return client;
}

/**
 * Get the current client
 */
export function getClient(): MinoClient | null {
  return client;
}

/**
 * Test server connection
 */
export async function testConnection(
  url: string,
  apiKey: string
): Promise<{ success: boolean; error?: string; serverIdentity?: unknown }> {
  try {
    const testClient = new MinoClient({
      serverUrl: url,
      apiKey,
      timeout: 10000,
    });

    const health = await testClient.system.health();
    const info = await testClient.system.info();

    return {
      success: health.status === 'ok',
      serverIdentity: info,
    };
  } catch (error) {
    if (error instanceof MinoError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Connect via relay code
 */
export async function connectViaRelay(
  relayCode: string,
  relayUrl: string = 'https://relay.mino.ink'
): Promise<{ success: boolean; error?: string; connection?: ServerConnection }> {
  try {
    const response = await fetch(`${relayUrl.replace(/\/+$/, '')}/api/v1/pair/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: relayCode.trim().toUpperCase() }),
    });

    const payload = (await response.json()) as {
      success: boolean;
      data?: { serverUrl: string; apiKey: string };
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        success: false,
        error: payload.error?.message || 'Invalid relay code',
      };
    }

    if (!payload.data?.serverUrl || !payload.data?.apiKey) {
      return {
        success: false,
        error: 'Relay response is missing server credentials',
      };
    }

    const connection: ServerConnection = {
      url: payload.data.serverUrl,
      apiKey: payload.data.apiKey,
      relayCode,
      status: 'connected',
      lastSyncAt: new Date().toISOString(),
    };

    // Save connection
    await storage.setItem(storage.STORAGE_KEYS.SERVER_URL, connection.url);
    await storage.setItem(storage.STORAGE_KEYS.API_KEY, connection.apiKey);
    if (relayCode) {
      await storage.setItem(storage.STORAGE_KEYS.RELAY_CODE, relayCode);
    }

    // Initialize client
    initClient(connection);

    return {
      success: true,
      connection,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Relay connection failed',
    };
  }
}

/**
 * Connect directly with URL and API key
 */
export async function connectDirect(
  url: string,
  apiKey: string
): Promise<{ success: boolean; error?: string; connection?: ServerConnection }> {
  const testResult = await testConnection(url, apiKey);

  if (!testResult.success) {
    return {
      success: false,
      error: testResult.error,
    };
  }

  const connection: ServerConnection = {
    url,
    apiKey,
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
  };

  // Save connection
  await storage.setItem(storage.STORAGE_KEYS.SERVER_URL, url);
  await storage.setItem(storage.STORAGE_KEYS.API_KEY, apiKey);

  // Initialize client
  initClient(connection);

  return {
    success: true,
    connection,
  };
}

/**
 * Disconnect and clear stored credentials
 */
export async function disconnect(): Promise<void> {
  client = null;
  await storage.removeItem(storage.STORAGE_KEYS.SERVER_URL);
  await storage.removeItem(storage.STORAGE_KEYS.API_KEY);
  await storage.removeItem(storage.STORAGE_KEYS.RELAY_CODE);
}

/**
 * Restore connection from stored credentials
 */
export async function restoreConnection(): Promise<ServerConnection | null> {
  const url = await storage.getItem<string>(storage.STORAGE_KEYS.SERVER_URL);
  const apiKey = await storage.getItem<string>(storage.STORAGE_KEYS.API_KEY);
  const relayCode = await storage.getItem<string>(storage.STORAGE_KEYS.RELAY_CODE);

  if (!url || !apiKey) {
    return null;
  }

  const connection: ServerConnection = {
    url,
    apiKey,
    relayCode: relayCode || undefined,
    status: 'disconnected',
  };

  // Test and restore connection
  const testResult = await testConnection(url, apiKey);
  if (testResult.success) {
    connection.status = 'connected';
    initClient(connection);
  }

  return connection;
}

export default {
  initClient,
  getClient,
  testConnection,
  connectViaRelay,
  connectDirect,
  disconnect,
  restoreConnection,
};
