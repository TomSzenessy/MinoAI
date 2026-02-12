/**
 * Connect links shared by startup banner and setup API.
 *
 * Keeps URL generation in one place to avoid drift across code paths.
 */

const DEFAULT_LOCAL_UI_ORIGIN = "http://localhost:3000";
const DEFAULT_LOCAL_DEV_UI_ORIGIN = "http://localhost:5173";

export interface RelayConnectLinks {
  testMinoInk: string;
  minoInk: string;
  localUi: string;
  localDevUi: string;
}

export interface DirectConnectLinks {
  testMinoInk: string;
  minoInk: string;
  localUi: string;
  localDevUi: string;
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveLocalDevUiOrigin(): string {
  const fromEnv = process.env.MINO_LOCAL_DEV_UI_ORIGIN;
  if (!fromEnv || !fromEnv.trim()) {
    return DEFAULT_LOCAL_DEV_UI_ORIGIN;
  }

  try {
    const parsed = new URL(fromEnv.trim());
    return normalizeOrigin(parsed.toString());
  } catch {
    return DEFAULT_LOCAL_DEV_UI_ORIGIN;
  }
}

export function buildRelayConnectLinks(
  relayLinkParams: URLSearchParams,
  localUiOrigin: string = DEFAULT_LOCAL_UI_ORIGIN,
): RelayConnectLinks {
  const params = relayLinkParams.toString();
  const localDevUiOrigin = resolveLocalDevUiOrigin();
  const normalizedLocalUiOrigin = normalizeOrigin(localUiOrigin);

  return {
    testMinoInk: `https://test.mino.ink/link?${params}`,
    minoInk: `https://mino.ink/link?${params}`,
    localUi: `${normalizedLocalUiOrigin}/link?${params}`,
    localDevUi: `${localDevUiOrigin}/link?${params}`,
  };
}

export function buildDirectConnectLinks(
  directLinkParams: URLSearchParams,
  publicServerUrl: string,
): DirectConnectLinks {
  const params = directLinkParams.toString();
  const localDevUiOrigin = resolveLocalDevUiOrigin();

  return {
    testMinoInk: `https://test.mino.ink/link?${params}`,
    minoInk: `https://mino.ink/link?${params}`,
    localUi: `${normalizeOrigin(publicServerUrl)}/link?${params}`,
    localDevUi: `${localDevUiOrigin}/link?${params}`,
  };
}
