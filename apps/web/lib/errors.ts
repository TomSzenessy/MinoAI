import { ApiRequestError } from "./api";

export function mapLinkError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return "The API key is invalid for this server.";
    }

    if (error.code === "TIMEOUT") {
      return "The server did not respond in time. Check that it is reachable.";
    }

    if (error.code === "NETWORK_ERROR") {
      return "Unable to reach the server. Check URL, CORS, and tunnel/domain configuration.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while linking server.";
}
