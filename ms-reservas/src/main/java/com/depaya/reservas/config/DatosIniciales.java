package com.depaya.reservas.config;

import com.depaya.reservas.model.EstadoReserva;
import com.depaya.reservas.model.Reserva;
import com.depaya.reservas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// Datos de ejemplo, con fechas relativas a hoy.
@Slf4j
@Component
@RequiredArgsConstructor
public class DatosIniciales implements CommandLineRunner {

    private static final String IMG_1 = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";
    private static final String IMG_3 = "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80";
    private static final String IMG_5 = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";
    private static final String IMG_6 = "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80";

    private final ReservaRepository repo;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }
        LocalDate hoy = LocalDate.now();
        List<Reserva> lista = List.of(
                reserva(1L, "Moderno Depa frente al Malecón", "Miraflores", "Vista al mar", IMG_1,
                        1L, "Alonso Vargas", 4L, "Diego Rojas", "drojas@gmail.com",
                        hoy.plusDays(10), hoy.plusDays(15), 2, "280.00", EstadoReserva.CONFIRMADA),
                reserva(4L, "Estudio bohemio cultural", "Barranco", "Moderno", IMG_3,
                        2L, "Mariana Silva", 5L, "Valeria Campos", "vcampos@yahoo.com",
                        hoy.plusDays(20), hoy.plusDays(22), 2, "190.00", EstadoReserva.PENDIENTE),
                reserva(7L, "Penthouse de lujo con terraza", "Miraflores", "Moderno", IMG_1,
                        1L, "Alonso Vargas", 6L, "Camila Torres", "ctorres@hotmail.com",
                        hoy.plusDays(28), hoy.plusDays(30), 4, "450.00", EstadoReserva.CONFIRMADA),
                reserva(6L, "Mini depa céntrico y económico", "Lince", "Moderno", IMG_5,
                        3L, "Roberto Mendoza", 4L, "Diego Rojas", "drojas@gmail.com",
                        hoy.plusDays(40), hoy.plusDays(54), 1, "120.00", EstadoReserva.CONFIRMADA),
                reserva(9L, "Casa de playa remodelada", "Chorrillos", "Playa", IMG_6,
                        3L, "Roberto Mendoza", 5L, "Valeria Campos", "vcampos@yahoo.com",
                        hoy.plusDays(60), hoy.plusDays(63), 6, "320.00", EstadoReserva.PENDIENTE));
        repo.saveAll(lista);
        log.info("{} reservas de ejemplo creadas.", lista.size());
    }

    private static Reserva reserva(Long idDepartamento, String titulo, String distrito, String categoria, String imagen,
                                   Long idPropietario, String propietario, Long idInquilino, String inquilino,
                                   String correo, LocalDate ingreso, LocalDate salida, int huespedes,
                                   String precioNoche, EstadoReserva estado) {
        long noches = salida.toEpochDay() - ingreso.toEpochDay();
        BigDecimal precio = new BigDecimal(precioNoche);
        Reserva r = new Reserva();
        r.setIdDepartamento(idDepartamento);
        r.setDepartamentoTitulo(titulo);
        r.setDistrito(distrito);
        r.setCategoria(categoria);
        r.setImagenUrl(imagen);
        r.setIdPropietario(idPropietario);
        r.setPropietarioNombre(propietario);
        r.setIdInquilino(idInquilino);
        r.setInquilinoNombre(inquilino);
        r.setInquilinoCorreo(correo);
        r.setFechaIngreso(ingreso);
        r.setFechaSalida(salida);
        r.setNoches((int) noches);
        r.setCantidadHuespedes(huespedes);
        r.setPrecioNoche(precio);
        r.setTotal(precio.multiply(BigDecimal.valueOf(noches)));
        r.setEstado(estado);
        return r;
    }
}
