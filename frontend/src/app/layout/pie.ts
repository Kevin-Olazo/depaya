import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sesion } from '../core/services/sesion';

@Component({
  selector: 'app-pie',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="pie">
      <div class="contenedor rejilla">
        <div class="marca">
          <h2>DepaYa</h2>
          <p>Transformando la manera de alquilar y encontrar tu espacio ideal en Perú.</p>
        </div>
        <nav aria-label="Explorar">
          <h3>Explorar</h3>
          <a routerLink="/departamentos">Todos los departamentos</a>
          <a routerLink="/departamentos" [queryParams]="{ categoria: 'Vista al mar' }">Vista al mar</a>
          <a routerLink="/departamentos" [queryParams]="{ mascotas: true }">Aceptan mascotas</a>
        </nav>
        <nav aria-label="Cuenta">
          <h3>Tu cuenta</h3>
          @if (sesion.activa()) {
            <a routerLink="/cuenta">Mi cuenta</a>
          } @else {
            <a routerLink="/login">Iniciar sesión</a>
            <a routerLink="/registro">Crear una cuenta</a>
            <a routerLink="/registro" [queryParams]="{ rol: 'PROPIETARIO' }">Publicar mi departamento</a>
          }
        </nav>
        <div>
          <h3>Cómo cuidamos tu reserva</h3>
          <p>Reembolso de hasta 48 h si cancelas con 1 día o más de anticipación. Pagos simulados: nunca pedimos datos reales de tarjeta.</p>
        </div>
      </div>
      <div class="contenedor legal">© {{ anio }} DepaYa · Proyecto académico — Desarrollo de Servicios Web II, Cibertec.</div>
    </footer>
  `,
  styles: `
    .pie { background: #14161c; color: #cbd0d9; padding: 44px 0 20px; margin-top: 40px; }
    .rejilla { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.4fr; gap: 32px; padding-bottom: 28px; }
    h2 { color: #fff; font-size: 1.5rem; margin-bottom: 10px; }
    h3 { color: #fff; font-size: 0.95rem; margin-bottom: 12px; }
    nav { display: grid; gap: 8px; align-content: start; }
    a { color: #cbd0d9; font-size: 0.92rem; }
    a:hover { color: #fff; text-decoration: underline; }
    p { font-size: 0.92rem; line-height: 1.6; max-width: 36ch; }
    .legal { border-top: 1px solid #2a2e39; padding-top: 18px; font-size: 0.82rem; color: #8b92a1; }
    @media (max-width: 880px) { .rejilla { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .rejilla { grid-template-columns: 1fr; } }
  `,
})
export class Pie {
  protected readonly sesion = inject(Sesion);
  protected readonly anio = new Date().getFullYear();
}
