/** Acepta solo rutas internas ("/algo"), nunca direcciones externas (evita redirecciones abiertas). */
export function destinoSeguro(url: string | null | undefined): string | null {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') ? url : null;
}
