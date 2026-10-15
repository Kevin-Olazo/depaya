package com.depaya.pagos.repository;

import com.depaya.pagos.dto.FiltroPago;
import com.depaya.pagos.dto.TotalesDTO;
import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.MetodoPago;
import com.depaya.pagos.model.Pago;
import com.depaya.pagos.service.PagoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Pruebas de la capa de datos: insertar, actualizar, eliminar y listar.
@DataJpaTest
class PagoRepositoryTest {

    @Autowired
    private PagoRepository repo;

    private Pago pago(Long idReserva, Long idInquilino, Long idPropietario, String monto, EstadoPago estado) {
        BigDecimal total = new BigDecimal(monto);
        BigDecimal comision = PagoService.calcularComision(total, BigDecimal.TEN);
        Pago p = new Pago();
        p.setIdReserva(idReserva);
        p.setIdInquilino(idInquilino);
        p.setInquilinoNombre("Inquilino " + idInquilino);
        p.setInquilinoCorreo("inq" + idInquilino + "@test.com");
        p.setIdPropietario(idPropietario);
        p.setDepartamentoTitulo("Depa de prueba");
        p.setDistrito("Miraflores");
        p.setMonto(total);
        p.setComision(comision);
        p.setMontoPropietario(total.subtract(comision));
        p.setMetodo(MetodoPago.YAPE);
        p.setEstado(estado);
        if (estado == EstadoPago.COMPLETADO) {
            p.setFechaPago(LocalDateTime.now());
        }
        return p;
    }

    @Test
    void insertar() {
        Pago guardado = repo.saveAndFlush(pago(1L, 10L, 99L, "1400.00", EstadoPago.PROCESANDO));

        assertNotNull(guardado.getId());
        assertNotNull(guardado.getFechaCreacion());
        assertEquals("PEN", guardado.getMoneda());
        assertEquals(0, new BigDecimal("140.00").compareTo(guardado.getComision()));
        assertEquals(0, new BigDecimal("1260.00").compareTo(guardado.getMontoPropietario()));
    }

    @Test
    void actualizar() {
        Pago guardado = repo.saveAndFlush(pago(1L, 10L, 99L, "500.00", EstadoPago.PROCESANDO));

        guardado.setEstado(EstadoPago.COMPLETADO);
        guardado.setReferenciaPasarela("SIM-ABC12345");
        repo.saveAndFlush(guardado);

        Pago leido = repo.findById(guardado.getId()).orElseThrow();
        assertEquals(EstadoPago.COMPLETADO, leido.getEstado());
        assertEquals("SIM-ABC12345", leido.getReferenciaPasarela());
    }

    @Test
    void eliminar() {
        Pago guardado = repo.saveAndFlush(pago(1L, 10L, 99L, "500.00", EstadoPago.CANCELADO));

        repo.deleteById(guardado.getId());
        repo.flush();

        assertFalse(repo.existsById(guardado.getId()));
    }

    @Test
    void listarYFiltrar() {
        repo.save(pago(1L, 10L, 99L, "100.00", EstadoPago.COMPLETADO));
        repo.save(pago(2L, 10L, 98L, "200.00", EstadoPago.PROCESANDO));
        repo.saveAndFlush(pago(3L, 11L, 99L, "300.00", EstadoPago.COMPLETADO));

        assertEquals(3, repo.findAll().size());

        FiltroPago porInquilino = new FiltroPago();
        porInquilino.setIdInquilino(10L);
        assertEquals(2, repo.findAll(PagoSpecs.filtrar(porInquilino)).size());

        FiltroPago porEstado = new FiltroPago();
        porEstado.setEstado(EstadoPago.COMPLETADO);
        porEstado.setIdPropietario(99L);
        assertEquals(2, repo.findAll(PagoSpecs.filtrar(porEstado)).size());

        FiltroPago porTexto = new FiltroPago();
        porTexto.setQ("INQ11@");
        assertEquals(1, repo.findAll(PagoSpecs.filtrar(porTexto)).size());
    }

    @Test
    void totalesSoloCuentanCompletados() {
        repo.save(pago(1L, 10L, 99L, "100.00", EstadoPago.COMPLETADO));
        repo.save(pago(2L, 10L, 99L, "300.00", EstadoPago.COMPLETADO));
        repo.save(pago(3L, 10L, 99L, "999.00", EstadoPago.PROCESANDO));
        repo.saveAndFlush(pago(4L, 10L, 98L, "50.00", EstadoPago.COMPLETADO));

        TotalesDTO propietario = repo.totales(EstadoPago.COMPLETADO, 99L);
        assertEquals(2, propietario.getCantidad());
        assertEquals(0, new BigDecimal("400.00").compareTo(propietario.getMonto()));
        assertEquals(0, new BigDecimal("40.00").compareTo(propietario.getComision()));
        assertEquals(0, new BigDecimal("360.00").compareTo(propietario.getMontoPropietario()));

        TotalesDTO todos = repo.totales(EstadoPago.COMPLETADO, 0L);
        assertEquals(3, todos.getCantidad());

        TotalesDTO ninguno = repo.totales(EstadoPago.REEMBOLSADO, 0L);
        assertEquals(0, ninguno.getCantidad());
        assertEquals(0, BigDecimal.ZERO.compareTo(ninguno.getMonto()));
    }

    @Test
    void reembolsosVencidos() {
        Pago vencido = pago(1L, 10L, 99L, "100.00", EstadoPago.REEMBOLSO_PENDIENTE);
        vencido.setFechaLimiteReembolso(LocalDateTime.now().minusHours(1));
        Pago vigente = pago(2L, 10L, 99L, "100.00", EstadoPago.REEMBOLSO_PENDIENTE);
        vigente.setFechaLimiteReembolso(LocalDateTime.now().plusHours(40));
        repo.save(vencido);
        repo.saveAndFlush(vigente);

        List<Pago> lista = repo.findByEstadoAndFechaLimiteReembolsoLessThanEqual(
                EstadoPago.REEMBOLSO_PENDIENTE, LocalDateTime.now());

        assertEquals(1, lista.size());
        assertEquals(vencido.getId(), lista.get(0).getId());
        assertTrue(repo.existsByIdReservaAndEstadoIn(2L, List.of(EstadoPago.REEMBOLSO_PENDIENTE)));
    }
}
