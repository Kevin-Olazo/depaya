import { Injectable, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Rol, Usuario } from '../models/api.models';

/** Claims del JWT que emite ms-auth. */
export interface Claims {
  sub: string;
  rol: Rol;
  nombre: string;
  correo: string;
  iat: number;
  exp: number;
}

const CLAVE_TOKEN = 'depaya.token';

function decodificar(token: string | null): Claims | null {
  if (!token) return null;
  try {
    const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(carga), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as Claims;
    return claims && claims.sub && claims.rol && claims.exp ? claims : null;
  } catch {
    return null;
  }
}

function vencido(claims: Claims | null): boolean {
  return !claims || claims.exp * 1000 <= Date.now();
}

function leerAlmacen(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function escribirAlmacen(token: string | null): void {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* modo privado o almacenamiento bloqueado: la sesión vive solo en memoria */
  }
}

/** Estado de la sesión: token JWT (en localStorage), datos del token y perfil cargado. Sin dependencias HTTP. */
@Injectable({ providedIn: 'root' })
export class Sesion {
  readonly token = signal<string | null>(null);
  /** Datos completos del usuario (de login/registro o de /api/auth/me). */
  readonly perfil = signal<Usuario | null>(null);

  readonly claims = computed(() => decodificar(this.token()));
  readonly activa = computed(() => this.claims() !== null);
  readonly rol = computed(() => this.claims()?.rol ?? null);
  readonly id = computed(() => (this.claims() ? Number(this.claims()!.sub) : null));
  /** Si ya se cargó el perfil se usa (refleja ediciones); si no, el nombre que trae el token. */
  readonly nombre = computed(() => {
    const p = this.perfil();
    return p ? `${p.nombre} ${p.apellido}`.trim() : (this.claims()?.nombre ?? '');
  });
  readonly correo = computed(() => this.perfil()?.correo ?? this.claims()?.correo ?? '');
  readonly iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );

  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  readonly esPropietario = computed(() => this.rol() === 'PROPIETARIO');
  readonly esInquilino = computed(() => this.rol() === 'INQUILINO');
  /** Puede reservar y pagar: INQUILINO y PROPIETARIO (el ADMIN no). */
  readonly esHuesped = computed(() => this.esInquilino() || this.esPropietario());

  /** Se emite cuando el token vence estando la pestaña abierta. */
  readonly vencida$ = new Subject<void>();
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.aplicar(leerAlmacen());
    // Si otra pestaña inicia o cierra sesión, esta se entera.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CLAVE_TOKEN || e.key === null) {
          this.perfil.set(null);
          this.aplicar(leerAlmacen());
        }
      });
    }
  }

  /** Guarda el token (login o registro correcto). */
  iniciar(token: string, perfil: Usuario | null = null): void {
    escribirAlmacen(token);
    this.aplicar(token);
    this.perfil.set(perfil);
  }

  cerrar(): void {
    escribirAlmacen(null);
    this.aplicar(null);
    this.perfil.set(null);
  }

  private aplicar(token: string | null): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
    const claims = decodificar(token);
    if (!token || vencido(claims)) {
      if (token) escribirAlmacen(null); // token vencido de una visita anterior
      this.token.set(null);
      return;
    }
    this.token.set(token);
    const restante = claims!.exp * 1000 - Date.now();
    // setTimeout no admite más de ~24 días; el token dura 8 h.
    this.temporizador = setTimeout(() => {
      this.cerrar();
      this.vencida$.next();
    }, Math.min(restante, 2_000_000_000));
  }
}
