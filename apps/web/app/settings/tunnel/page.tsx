'use client';

import { useState } from 'react';
import { SettingsLayout, type SettingsTabId } from '@/components/settings-layout';

const SETTINGS_TABS: Array<{ id: SettingsTabId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'server', label: 'Server' },
  { id: 'agent', label: 'Agent' },
  { id: 'channels', label: 'Channels' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'about', label: 'About' },
] as const;

export default function TunnelSettingsPage() {
  const [tunnelToken, setTunnelToken] = useState('');
  const [relayUrl, setRelayUrl] = useState('https://relay.mino.ink');
  const [connectionMode, setConnectionMode] = useState<'relay' | 'direct'>('relay');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      // PATCH /api/v1/system/config is not exposed yet, so keep this page informational.
      const summary =
        connectionMode === 'relay'
          ? `relayUrl=${relayUrl || 'https://relay.mino.ink'}`
          : `tunnelToken=${tunnelToken ? 'set' : 'missing'}`;
      setTestResult({
        success: true,
        message: `Saved locally (${summary}). Apply these values in server env/config and redeploy.`,
      });
    } catch {
      setTestResult({ success: false, message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/v1/health');
      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful! Server is reachable.' });
      } else {
        setTestResult({ success: false, message: 'Server returned an error' });
      }
    } catch {
      setTestResult({ success: false, message: 'Failed to connect to server' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SettingsLayout title="Cloudflare Tunnel" tabs={SETTINGS_TABS} activeTab="server">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cloudflare Tunnel
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configure secure remote access to your Mino server without opening ports.
          </p>
        </div>

        {/* Connection Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Connection Mode
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="connectionMode"
                value="relay"
                checked={connectionMode === 'relay'}
                onChange={() => setConnectionMode('relay')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Relay Mode (Recommended)
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use the Mino relay service for easy setup. No configuration required.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="connectionMode"
                value="direct"
                checked={connectionMode === 'direct'}
                onChange={() => setConnectionMode('direct')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Direct Tunnel (Cloudflare)
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use your own Cloudflare Tunnel for full control and custom domains.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Relay Configuration */}
        {connectionMode === 'relay' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Relay Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relay Server URL
                </label>
                <input
                  type="url"
                  value={relayUrl}
                  onChange={(e) => setRelayUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://relay.mino.ink"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The default relay server is provided for convenience. You can host your own.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cloudflare Tunnel Configuration */}
        {connectionMode === 'direct' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cloudflare Tunnel Setup
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tunnel Token
                </label>
                <input
                  type="password"
                  value={tunnelToken}
                  onChange={(e) => setTunnelToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your Cloudflare tunnel token"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get your tunnel token from the Cloudflare Zero Trust dashboard.
                </p>
              </div>

              {/* Setup Instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Setup Instructions
                </h3>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
                  <li>
                    Go to{' '}
                    <a
                      href="https://one.dash.cloudflare.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Cloudflare Zero Trust Dashboard
                    </a>
                  </li>
                  <li>Navigate to Networks {'>'} Tunnels</li>
                  <li>Create a new tunnel or select an existing one</li>
                  <li>Copy the tunnel token from the configuration</li>
                  <li>Paste the token above and save</li>
                </ol>
              </div>

              {/* Docker Configuration */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Docker Compose Configuration
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto">
{`# Add this to your docker-compose.yml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token \${TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=your-tunnel-token-here
    restart: unless-stopped

# Or use environment variable:
# TUNNEL_TOKEN=your-tunnel-token-here`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-lg ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Additional Resources */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Resources
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cloudflare Tunnel Documentation
              </a>
            </li>
            <li>
              <a
                href="/docs/deployment/cloudflare-tunnel"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mino Cloudflare Tunnel Guide
              </a>
            </li>
            <li>
              <a
                href="/docs/deployment/docker"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Docker Deployment Guide
              </a>
            </li>
          </ul>
        </div>
      </div>
    </SettingsLayout>
  );
}
