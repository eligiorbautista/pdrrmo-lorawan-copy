/**
 * Client environment configuration.
 * Validates that required VITE_ env vars are present.
 */

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please copy client/.env.example to client/.env and fill in your values.`,
    );
  }
  return value;
}

export const ENV = {
  WS_URL: requireEnv("VITE_WS_URL"),
  API_URL: requireEnv("VITE_API_URL"),
} as const;
