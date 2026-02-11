export type AppEnv = "development" | "test" | "production";

export interface WebConfig {
  appEnv: AppEnv;
  appOrigin: string;
  defaultLinkTarget: string;
}

function normalizeEnv(value: string | undefined): AppEnv {
  if (value === "test" || value === "production") {
    return value;
  }
  return "development";
}

export function getWebConfig(): WebConfig {
  const appEnv = normalizeEnv(process.env.NEXT_PUBLIC_APP_ENV);
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:5173";
  const defaultLinkTarget =
    process.env.NEXT_PUBLIC_DEFAULT_LINK_TARGET ??
    (appEnv === "production" ? "https://mino.ink" : "https://test.mino.ink");

  return {
    appEnv,
    appOrigin,
    defaultLinkTarget,
  };
}
