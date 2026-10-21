import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { ApiError } from '../services/api-error';
import { Sesion } from '../services/sesion';
import { jwtDePrueba } from '../testing/token-falso';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

const API = environment.apiUrl;

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let mensajes: MessageService;
  let router: Router;

  function preparar(conToken: boolean) {
    localStorage.clear();
    if (conToken) localStorage.setItem('depaya.token', jwtDePrueba());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        MessageService,
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    mensajes = TestBed.inject(MessageService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  afterEach(() => {
    backend.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('401 con token: cierra la sesión y lleva al login', () => {
    preparar(true);
    const sesion = TestBed.inject(Sesion);
    expect(sesion.activa()).toBe(true);
    let error: unknown;
    http.get(`${API}/api/reservas/mis-reservas`).subscribe({ error: (e) => (error = e) });
    backend
      .expectOne(`${API}/api/reservas/mis-reservas`)
      .flush({ status: 401, mensaje: 'Falta el token o es inválido.' }, { status: 401, statusText: 'Unauthorized' });
    expect(sesion.activa()).toBe(false);
    expect(localStorage.getItem('depaya.token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.anything());
    expect(error).toBeInstanceOf(ApiError);
  });

  it('401 del login (sin token) no cierra nada: el formulario muestra el mensaje', () => {
    preparar(false);
    const aviso = vi.spyOn(mensajes, 'add');
    let error: unknown;
    http.post(`${API}/api/auth/login`, {}).subscribe({ error: (e) => (error = e) });
    backend
      .expectOne(`${API}/api/auth/login`)
      .flush({ status: 401, mensaje: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
    expect((error as ApiError).mensajeApi).toBe('Correo o contraseña incorrectos.');
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('muestra el mensaje del backend y la lista de errores de validación (400)', () => {
    preparar(true);
    const aviso = vi.spyOn(mensajes, 'add');
    let error: ApiError | undefined;
    http.post(`${API}/api/reservas`, {}).subscribe({ error: (e) => (error = e) });
    backend.expectOne(`${API}/api/reservas`).flush(
      {
        status: 400,
        mensaje: 'Datos inválidos.',
        errores: [
          { campo: 'fechaIngreso', mensaje: 'La fecha de ingreso es obligatoria.' },
          { campo: 'cantidadHuespedes', mensaje: 'Debe haber al menos 1 huésped.' },
        ],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(error?.esValidacion).toBe(true);
    expect(error?.errores).toHaveLength(2);
    const toast = aviso.mock.calls[0][0];
    expect(toast.summary).toBe('Datos inválidos.');
    expect(toast.detail).toContain('La fecha de ingreso es obligatoria.');
    expect(toast.detail).toContain('Debe haber al menos 1 huésped.');
  });

  it('un 403 muestra el mensaje del backend sin cerrar la sesión', () => {
    preparar(true);
    const aviso = vi.spyOn(mensajes, 'add');
    http.post(`${API}/api/departamentos`, {}).subscribe({ error: () => undefined });
    backend
      .expectOne(`${API}/api/departamentos`)
      .flush({ status: 403, mensaje: 'Tus publicaciones están bloqueadas. Contacta al administrador.' }, { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(Sesion).activa()).toBe(true);
    expect(aviso.mock.calls[0][0].detail).toBe('Tus publicaciones están bloqueadas. Contacta al administrador.');
  });

  it('lee el mensaje de error aunque la respuesta sea un blob (descarga CSV)', async () => {
    preparar(true);
    let error: ApiError | undefined;
    http.get(`${API}/api/pagos/exportar`, { responseType: 'blob' }).subscribe({ error: (e) => (error = e) });
    const cuerpo = new Blob([JSON.stringify({ status: 403, mensaje: 'No tienes permiso para esta operación.' })], { type: 'application/json' });
    backend.expectOne((r) => r.url.includes('/api/pagos/exportar')).flush(cuerpo, { status: 403, statusText: 'Forbidden' });
    await vi.waitFor(() => expect(error).toBeDefined());
    expect(error?.mensajeApi).toBe('No tienes permiso para esta operación.');
  });

  it('sin conexión (status 0) da un mensaje claro', () => {
    preparar(false);
    let error: ApiError | undefined;
    http.get(`${API}/api/departamentos`).subscribe({ error: (e) => (error = e) });
    backend.expectOne(`${API}/api/departamentos`).error(new ProgressEvent('error'), { status: 0 });
    expect(error?.estado).toBe(0);
    expect(error?.mensajeApi).toContain('No se pudo conectar');
  });
});
