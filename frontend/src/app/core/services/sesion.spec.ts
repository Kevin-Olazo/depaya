import { TestBed } from '@angular/core/testing';
import { jwtDePrueba } from '../testing/token-falso';
import { Sesion } from './sesion';

describe('Sesion', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('sin token no hay sesión', () => {
    const sesion = TestBed.inject(Sesion);
    expect(sesion.activa()).toBe(false);
    expect(sesion.rol()).toBeNull();
  });

  it('lee id, rol, nombre (con tildes) y correo del JWT y lo guarda en localStorage', () => {
    const sesion = TestBed.inject(Sesion);
    const token = jwtDePrueba({ sub: '7', rol: 'PROPIETARIO', nombre: 'María Núñez', correo: 'mnunez@gmail.com' });
    sesion.iniciar(token);
    expect(sesion.activa()).toBe(true);
    expect(sesion.id()).toBe(7);
    expect(sesion.rol()).toBe('PROPIETARIO');
    expect(sesion.nombre()).toBe('María Núñez');
    expect(sesion.iniciales()).toBe('MN');
    expect(sesion.esPropietario()).toBe(true);
    expect(sesion.esHuesped()).toBe(true);
    expect(sesion.esAdmin()).toBe(false);
    expect(localStorage.getItem('depaya.token')).toBe(token);
  });

  it('el ADMIN no es huésped (no reserva)', () => {
    const sesion = TestBed.inject(Sesion);
    sesion.iniciar(jwtDePrueba({ rol: 'ADMIN' }));
    expect(sesion.esAdmin()).toBe(true);
    expect(sesion.esHuesped()).toBe(false);
  });

  it('descarta un token vencido guardado de una visita anterior', () => {
    localStorage.setItem('depaya.token', jwtDePrueba({ exp: Math.floor(Date.now() / 1000) - 60 }));
    const sesion = TestBed.inject(Sesion);
    expect(sesion.activa()).toBe(false);
    expect(localStorage.getItem('depaya.token')).toBeNull();
  });

  it('descarta un token que no se puede leer', () => {
    localStorage.setItem('depaya.token', 'esto-no-es-un-jwt');
    expect(TestBed.inject(Sesion).activa()).toBe(false);
  });

  it('cerrar() borra el token y el perfil', () => {
    const sesion = TestBed.inject(Sesion);
    sesion.iniciar(jwtDePrueba());
    sesion.cerrar();
    expect(sesion.activa()).toBe(false);
    expect(localStorage.getItem('depaya.token')).toBeNull();
  });

  it('avisa y cierra cuando el token vence con la pestaña abierta', () => {
    vi.useFakeTimers();
    const sesion = TestBed.inject(Sesion);
    const avisos = vi.fn();
    sesion.vencida$.subscribe(avisos);
    sesion.iniciar(jwtDePrueba({ exp: Math.floor(Date.now() / 1000) + 30 }));
    expect(sesion.activa()).toBe(true);
    vi.advanceTimersByTime(31_000);
    expect(sesion.activa()).toBe(false);
    expect(avisos).toHaveBeenCalledTimes(1);
  });

  it('sigue funcionando en memoria si localStorage falla', () => {
    const sesion = TestBed.inject(Sesion);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => sesion.iniciar(jwtDePrueba())).not.toThrow();
    expect(sesion.activa()).toBe(true);
    vi.restoreAllMocks();
  });
});
