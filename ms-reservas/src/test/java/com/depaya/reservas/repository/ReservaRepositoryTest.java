package com.depaya.reservas.repository;

import com.depaya.reservas.dto.FiltroReserva;
import com.depaya.reservas.model.EstadoReembolso;
import com.depaya.reservas.model.EstadoReserva;
import com.depaya.reservas.model.Reserva;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Pruebas de la capa de datos: insertar, actualizar, eliminar y listar.
@DataJpaTest
class ReservaRepositoryTest {

    private static final List<EstadoReserva> ACTIVAS = List.of(EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA);

    @Autowired
    private ReservaRepository repo;

    private Reserva reserva(Long idDepartamento, Long idInquilino, LocalDate ingreso, LocalDate salida) {
        Reserva r = new Reserva();
        r.setIdDepartamento(idDepartamento);
        r.setIdInquilino(idInquilino);
        r.setIdPropietario(99L);
        r.setDepartamentoTitulo("Depa " + idDepartamento);
        r.setDistrito("Miraflores");
        r.setCategoria("Moderno");
        r.setInquilinoNombre("Inquilino " + idInquilino);
        r.setInquilinoCorreo("inq" + idInquilino + "@test.com");
        r.setPropietarioNombre("Propietario");
        r.setFechaIngreso(ingreso);
        r.setFechaSalida(salida);
        r.setNoches((int) (salida.toEpochDay() - ingreso.toEpochDay()));
        r.setCantidadHuespedes(2);
        r.setPrecioNoche(new BigDecimal("100.00"));
        r.setTotal(new BigDecimal("100.00").multiply(BigDecimal.valueOf(r.getNoches())));
        return r;
    }

    @Test
    void insertar() {
        LocalDate hoy = LocalDate.now();
        Reserva guardada = repo.saveAndFlush(reserva(1L, 10L, hoy.plusDays(5), hoy.plusDays(8)));

        assertNotNull(guardada.getId());
        assertNotNull(guardada.getFechaCreacion());
        assertEquals(EstadoReserva.PENDIENTE, guardada.getEstado());
        assertEquals(EstadoReembolso.NO_APLICA, guardada.getEstadoReembolso());
        assertEquals(0, new BigDecimal("300.00").compareTo(guardada.getTotal()));
    }

    @Test
    void actualizar() {
        LocalDate hoy = LocalDate.now();
        Reserva guardada = repo.saveAndFlush(reserva(1L, 10L, hoy.plusDays(5), hoy.plusDays(8)));

        guardada.setEstado(EstadoReserva.CANCELADA);
        guardada.setEstadoReembolso(EstadoReembolso.PENDIENTE);
        repo.saveAndFlush(guardada);

        Reserva leida = repo.findById(guardada.getId()).orElseThrow();
        assertEquals(EstadoReserva.CANCELADA, leida.getEstado());
        assertEquals(EstadoReembolso.PENDIENTE, leida.getEstadoReembolso());
        assertEquals(1, repo.contarReembolsosPendientes());
    }

    @Test
    void eliminar() {
        LocalDate hoy = LocalDate.now();
        Reserva guardada = repo.saveAndFlush(reserva(1L, 10L, hoy.plusDays(5), hoy.plusDays(8)));

        repo.deleteById(guardada.getId());
        repo.flush();

        assertFalse(repo.existsById(guardada.getId()));
    }

    @Test
    void listarYFiltrar() {
        LocalDate hoy = LocalDate.now();
        repo.save(reserva(1L, 10L, hoy.plusDays(5), hoy.plusDays(8)));
        repo.save(reserva(2L, 10L, hoy.plusDays(5), hoy.plusDays(8)));
        Reserva otra = reserva(3L, 11L, hoy.plusDays(20), hoy.plusDays(22));
        otra.setEstado(EstadoReserva.CONFIRMADA);
        repo.saveAndFlush(otra);

        assertEquals(3, repo.findAll().size());

        FiltroReserva porInquilino = new FiltroReserva();
        porInquilino.setIdInquilino(10L);
        assertEquals(2, repo.findAll(ReservaSpecs.filtrar(porInquilino)).size());

        FiltroReserva porEstado = new FiltroReserva();
        porEstado.setEstado(EstadoReserva.CONFIRMADA);
        assertEquals(1, repo.findAll(ReservaSpecs.filtrar(porEstado)).size());

        FiltroReserva porFechas = new FiltroReserva();
        porFechas.setDesde(hoy.plusDays(15));
        porFechas.setHasta(hoy.plusDays(30));
        assertEquals(1, repo.findAll(ReservaSpecs.filtrar(porFechas)).size());
    }

    @Test
    void detectaChoqueDeFechas() {
        LocalDate hoy = LocalDate.now();
        Reserva existente = repo.saveAndFlush(reserva(1L, 10L, hoy.plusDays(10), hoy.plusDays(15)));

        // se solapa
        assertTrue(repo.existeChoque(1L, ACTIVAS, hoy.plusDays(12), hoy.plusDays(18), -1L));
        // el dia de salida queda libre
        assertFalse(repo.existeChoque(1L, ACTIVAS, hoy.plusDays(15), hoy.plusDays(18), -1L));
        // otro departamento
        assertFalse(repo.existeChoque(2L, ACTIVAS, hoy.plusDays(12), hoy.plusDays(18), -1L));
        // al excluir la propia reserva ya no choca (editar fechas)
        assertFalse(repo.existeChoque(1L, ACTIVAS, hoy.plusDays(12), hoy.plusDays(18), existente.getId()));
    }

    @Test
    void idsOcupadosIgnoraCanceladas() {
        LocalDate hoy = LocalDate.now();
        repo.save(reserva(1L, 10L, hoy.plusDays(10), hoy.plusDays(15)));
        Reserva cancelada = reserva(2L, 10L, hoy.plusDays(10), hoy.plusDays(15));
        cancelada.setEstado(EstadoReserva.CANCELADA);
        repo.saveAndFlush(cancelada);

        List<Long> ocupados = repo.idsOcupados(ACTIVAS, hoy.plusDays(11), hoy.plusDays(13), 0L);

        assertEquals(List.of(1L), ocupados);
        assertEquals(1, repo.ocupadas(1L, ACTIVAS, hoy).size());
        assertEquals(0, repo.ocupadas(2L, ACTIVAS, hoy).size());
    }
}
