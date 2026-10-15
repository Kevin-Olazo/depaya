# DepaYa – backend (microservicios en Java)

Spring Boot 4 · Java 21 · PostgreSQL · Eureka. Todo se consume por el gateway: **http://localhost:8080**

| Servicio | Puerto | Esquema BD |
|---|---|---|
| `eureka-server` (registro de servicios) | 8761 | – |
| `api-gateway` | 8080 | – |
| `ms-auth` (login, registro, usuarios) | 8081 | `usr` |
| `ms-departamentos` | 8082 | `dep` |
| `ms-reservas` | 8083 | `res` |
| `ms-pagos` | 8084 | `pag` |

Los servicios se registran en Eureka y se llaman entre sí por nombre (`ms-auth`, `ms-reservas`…), sin URLs escritas. Panel de Eureka: http://localhost:8761

## Cómo arrancar

1. Tener instalado JDK 21 o superior y PostgreSQL.
2. Crear la base de datos (una sola vez): `CREATE DATABASE depaya;`
3. Usuario y clave de PostgreSQL: por defecto `postgres` / `postgres`. Si los tuyos son otros, cámbialos en `spring.datasource.*` del `application.properties` de cada `ms-*`.
4. Levantar los 6 proyectos, primero `eureka-server` y luego los demás. Desde IntelliJ (abrir esta carpeta, que detecta los 6 proyectos, y ejecutar cada `*Application`) o por terminal, uno por ventana:

```bash
cd eureka-server && ./mvnw spring-boot:run
cd ms-auth && ./mvnw spring-boot:run
cd ms-departamentos && ./mvnw spring-boot:run
cd ms-reservas && ./mvnw spring-boot:run
cd ms-pagos && ./mvnw spring-boot:run
cd api-gateway && ./mvnw spring-boot:run
```

(En Windows: `mvnw.cmd spring-boot:run`.) Las tablas y los datos de ejemplo se crean solos al primer arranque. Tras arrancar, espera unos segundos a que los 5 servicios aparezcan en el panel de Eureka.

## Probar

Abrir `requests.http` en IntelliJ y ejecutar las peticiones de arriba hacia abajo.

Usuarios de ejemplo (clave **123456**): `admin@depaya.com` (ADMIN), `avargas@gmail.com` (PROPIETARIO), `drojas@gmail.com` (INQUILINO).

Pruebas de la capa de datos (no necesitan PostgreSQL): `./mvnw test` en esta carpeta.
