# DepaYa · Frontend (Angular 21 + PrimeNG)
1. Arranca el backend (carpeta raíz de este repositorio): todo se consume por el gateway `http://localhost:8080` (cámbialo en `src/environments/environment.ts`).
2. `npm install` y luego `npm start` → http://localhost:4200 (el CORS del gateway permite 4200 y 5173).
3. Cuentas de ejemplo (clave `123456`): `admin@depaya.com` (ADMIN), `avargas@gmail.com` (PROPIETARIO), `drojas@gmail.com` (INQUILINO).
4. `npm run build` genera `dist/DepaYa-Frontend/browser`; `npm test` corre las pruebas unitarias (Vitest).
5. Estructura: `core/` (sesión, interceptores, guards, servicios tipados), `shared/` (componentes comunes), `features/` (publico, huesped, propietario, admin, cuenta), carga perezosa por rol.
