/** Utilidad solo para pruebas: arma un JWT con la misma forma que emite ms-auth (la firma no se valida en el navegador). */
export function jwtDePrueba(datos: { sub?: string; rol?: string; nombre?: string; correo?: string; exp?: number } = {}): string {
  const b64 = (o: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  const ahora = Math.floor(Date.now() / 1000);
  const payload = {
    sub: datos.sub ?? '4',
    rol: datos.rol ?? 'INQUILINO',
    nombre: datos.nombre ?? 'Diego Rojas',
    correo: datos.correo ?? 'drojas@gmail.com',
    iat: ahora,
    exp: datos.exp ?? ahora + 8 * 3600,
  };
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`;
}
