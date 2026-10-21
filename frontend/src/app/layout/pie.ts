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
        <div class="marca-pie">
          <a routerLink="/" class="marca" aria-label="DepaYa, ir al inicio">
            <span class="marca-icono" aria-hidden="true"><i class="pi pi-building"></i></span>
            <span class="marca-texto">Depa<span class="ligera">Ya</span><small>ENCUENTRA TU ESPACIO</small></span>
          </a>
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
      <div class="contenedor legal">
        <span>Tu lugar, tu historia. © {{ anio }} DepaYa</span>
        <span>Proyecto académico — Desarrollo de Servicios Web II, Cibertec.</span>
      </div>
    </footer>
  `,
  styles: `
    .pie { background: #fff; border-top: 1px solid #eeeee8; padding: 48px 0 22px; margin-top: 8px; color: var(--dy-apagado); }
    .rejilla { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.4fr; gap: 36px; padding-bottom: 30px; }
    .marca { display: inline-flex; align-items: center; gap: 10px; color: var(--dy-marca); margin-bottom: 14px; }
    .marca-icono { display: grid; place-items: center; width: 36px; height: 36px; background: var(--dy-menta); border-radius: 12px; color: var(--dy-primario); }
    .marca-texto { font-family: var(--dy-fuente-titulos); font-size: 1.25rem; font-weight: 800; letter-spacing: -0.06em; line-height: 1; }
    .marca-texto .ligera { color: var(--dy-salvia); }
    .marca-texto small { display: block; font: 700 0.46rem 'DM Sans', sans-serif; letter-spacing: 0.18em; color: #7d8a80; margin-top: 4px; }
    h3 { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #64856a; margin-bottom: 14px; font-family: 'DM Sans', sans-serif; }
    nav { display: grid; gap: 9px; align-content: start; }
    nav a { font-size: 0.875rem; color: var(--dy-tinta-suave); }
    nav a:hover { color: var(--dy-musgo); text-decoration: underline; }
    p { font-size: 0.875rem; line-height: 1.7; max-width: 38ch; }
    .legal { border-top: 1px solid #eeeee8; padding-top: 18px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 0.78rem; }
    @media (max-width: 880px) { .rejilla { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .rejilla { grid-template-columns: 1fr; } }
  `,
})
export class Pie {
  protected readonly sesion = inject(Sesion);
  protected readonly anio = new Date().getFullYear();
}
