let globalAccessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

/**
 * Update the stored in-memory JWT access token.
 */
export const setGlobalAccessToken = (token: string | null) => {
  globalAccessToken = token;
};

/**
 * Register a callback to trigger when auth refresh fails (e.g. to redirect to login).
 */
export const registerAuthFailureListener = (callback: () => void) => {
  onAuthFailure = callback;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  json?: unknown;
}

/**
 * A wrapper around window.fetch that automatically injects Bearer tokens,
 * parses JSON bodies, enables cookie inclusion, and performs silent access token
 * refresh retries upon encountering 401 Unauthorized status codes.
 */
export async function apiFetch(path: string, options: RequestOptions = {}) {
  // Determine absolute API server endpoint
  const cleanBase = API_BASE_URL.replace(/\/api\/v1$/, ""); // Get base URL without "/api/v1"
  const url = path.startsWith("http")
    ? path
    : `${cleanBase}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options.headers || {});

  // Inject authentication header
  if (globalAccessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${globalAccessToken}`);
  }

  // Parse JSON payloads
  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }

  options.headers = headers;

  // Crucial: include credentials (cookies) for HTTP-only refresh tokens
  options.credentials = "include";

  let response = await fetch(url, options);

  // If unauthorized (401) and we are not already trying to log in or refresh:
  if (
    response.status === 401 &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/register")
  ) {
    try {
      // Attempt to silently refresh access token via HTTP-only cookie
      const refreshUrl = `${cleanBase}/api/auth/refresh`;
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newToken = data.access_token;

        // Save new token in-memory
        setGlobalAccessToken(newToken);

        // Update authorization header and retry request
        const newHeaders = new Headers(options.headers);
        newHeaders.set("Authorization", `Bearer ${newToken}`);
        options.headers = newHeaders;

        response = await fetch(url, options);
      } else {
        // Refresh token failed or is expired: trigger global failure listener
        setGlobalAccessToken(null);
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    } catch {
      // Clean up and trigger listener on error
      setGlobalAccessToken(null);
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  }

  // Handle generic error responses
  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // Keep fallback error string
    }
    throw new Error(errorDetail);
  }

  return response;
}
