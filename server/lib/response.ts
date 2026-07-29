/** Shared success envelope: { data, meta }. Keep every route returning this shape. */
export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return meta ? { data, meta } : { data, meta: {} };
}
