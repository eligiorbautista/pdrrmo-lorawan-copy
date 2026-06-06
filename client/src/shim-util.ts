/**
 * Browser-compatible shim for Node.js `util` module.
 * Provides the methods that tslog (used by @meshtastic/core) needs at runtime.
 *
 * Imported as: `import { formatWithOptions, types } from "util"`
 */

function formatStr(fmt: string, ...args: unknown[]): string {
  let i = 0;
  return fmt.replace(/%[sdifjoO%]/g, (match) => {
    if (match === "%%") return "%";
    const arg = args[i++];
    if (arg === undefined) return match;
    if (arg === null) return "null";
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  });
}

export function format(fmt: string, ...args: unknown[]): string {
  return formatStr(fmt, ...args);
}

export function formatWithOptions(
  _options: Record<string, unknown>,
  fmt: string,
  ...args: unknown[]
): string {
  return formatStr(fmt, ...args);
}

export function inspect(
  obj: unknown,
  _opts?: Record<string, unknown>,
): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function inherits(
  _ctor: unknown,
  _superCtor: unknown,
): void {
  // No-op for browser
}

export function promisify<T extends (...args: unknown[]) => unknown>(
  fn: T,
): T {
  return fn;
}

export function deprecate<T extends (...args: unknown[]) => unknown>(
  fn: T,
): T {
  return fn;
}

export function debuglog(): () => void {
  return () => {};
}

export const types = {};

export const isArray = Array.isArray;
export function isBoolean(v: unknown): boolean { return typeof v === "boolean"; }
export function isNull(v: unknown): boolean { return v === null; }
export function isNumber(v: unknown): boolean { return typeof v === "number"; }
export function isString(v: unknown): boolean { return typeof v === "string"; }
export function isUndefined(v: unknown): boolean { return v === undefined; }
export function isObject(v: unknown): boolean { return v !== null && typeof v === "object"; }
export function isFunction(v: unknown): boolean { return typeof v === "function"; }
export function isBuffer(_v: unknown): boolean { return false; }
