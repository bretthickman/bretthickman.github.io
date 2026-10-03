/** Keep public assets inside this version of the site when it lives at a subpath. */
export function publicUrl(path: string, base = import.meta.env?.BASE_URL ?? '/'): string {
  return path.startsWith('/') && !path.startsWith('//') ? `${base}${path.slice(1)}` : path;
}
