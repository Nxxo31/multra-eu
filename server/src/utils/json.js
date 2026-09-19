export const safeJson = (s, def) => {
  if (s == null) return def;
  if (typeof s === 'object') return s;
  try {
    return JSON.parse(s);
  } catch {
    return def;
  }
};
