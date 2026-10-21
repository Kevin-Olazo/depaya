import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { jwtDePrueba } from '../testing/token-falso';
import { authInterceptor, esRutaPublica } from './auth.interceptor';

const API = environment.apiUrl;

describe('esRutaPublica', () => {
  it.each([
    ['GET', `${API}/api/departamentos`],
    ['GET', `${API}/api/departamentos?q=depa&page=0&size=12`],
    ['GET', `${API}/api/departamentos/distritos`],
    ['GET', `${API}/api/departamentos/categorias`],
    ['GET', `${API}/api/departamentos/7`],
    ['GET', `${API}/api/reservas/ocupadas?idDepartamento=7`],
    ['POST', `${API}/api/auth/login`],
    ['POST', `${API}/api/auth/registro`],
  ])('%s %s no lleva token', (metodo, url) => {
    expect(esRutaPublica(metodo, url)).toBe(true);
  });

  it.each([
    ['GET', `${API}/api/departamentos/admin`],
    ['GET', `${API}/api/departamentos/mis-departamentos`],
    ['GET', `${API}/api/departamentos/resumen`],
    ['GET', `${API}/api/departamentos/exportar`],
    ['POST', `${API}/api/departamentos`],
    ['PUT', `${API}/api/departamentos/7/estado`],
    ['DELETE', `${API}/api/departamentos/7`],
    ['GET', `${API}/api/reservas/mis-reservas`],
    ['GET', `${API}/api/reservas/7`],
    ['POST', `${API}/api/reservas`],
    ['GET', `${API}/api/pagos/mis-pagos`],
    ['GET', `${API}/api/auth/me`],
    ['GET', `${API}/api/usuarios`],
  ])('%s %s sí lleva token', (metodo, url) => {
    expect(esRutaPublica(metodo, url)).toBe(false);
  });
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function preparar(conToken: boolean) {
    localStorage.clear();
    if (conToken) localStorage.setItem('depaya.token', jwtDePrueba());
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('agrega Authorization: Bearer a las rutas privadas', () => {
    preparar(true);
    http.get(`${API}/api/reservas/mis-reservas`).subscribe();
    const req = backend.expectOne(`${API}/api/reservas/mis-reservas`);
    expect(req.request.headers.get('Authorization')).toMatch(/^Bearer .+\..+\..+$/);
    req.flush({});
  });

  it('NO agrega el token al catálogo público aunque haya sesión', () => {
    preparar(true);
    http.get(`${API}/api/departamentos?page=0`).subscribe();
    http.get(`${API}/api/departamentos/3`).subscribe();
    http.get(`${API}/api/reservas/ocupadas?idDepartamento=3`).subscribe();
    for (const req of backend.match(() => true)) {
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('no inventa un token cuando no hay sesión', () => {
    preparar(false);
    http.get(`${API}/api/pagos/mis-pagos`).subscribe();
    const req = backend.expectOne(`${API}/api/pagos/mis-pagos`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no manda el token a otros dominios', () => {
    preparar(true);
    http.get('https://ejemplo.com/datos').subscribe();
    const req = backend.expectOne('https://ejemplo.com/datos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
