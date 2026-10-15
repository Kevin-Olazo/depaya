package com.depaya.pagos.config;

import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.MetodoPago;
import com.depaya.pagos.model.Pago;
import com.depaya.pagos.repository.PagoRepository;
import com.depaya.pagos.service.PagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// Datos de ejemplo: un pago por reserva de ejemplo.
@Slf4j
@Component
@RequiredArgsConstructor
public class DatosIniciales implements CommandLineRunner {

    private final PagoRepository repo;

    @Value("${depaya.comision.porcentaje:10}")
    private BigDecimal porcentaje;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }
        LocalDateTime ahora = LocalDateTime.now();
        List<Pago> lista = List.of(
                pago(1L, 4L, "Diego Rojas", "drojas@gmail.com", 1L, "Moderno Depa frente al Malecón", "Miraflores",
                        "1400.00", MetodoPago.VISA, EstadoPago.COMPLETADO, "niubiz_trx_8839201", ahora.minusDays(3)),
                pago(2L, 5L, "Valeria Campos", "vcampos@yahoo.com", 2L, "Estudio bohemio cultural", "Barranco",
                        "380.00", MetodoPago.YAPE, EstadoPago.PROCESANDO, null, null),
                pago(3L, 6L, "Camila Torres", "ctorres@hotmail.com", 1L, "Penthouse de lujo con terraza", "Miraflores",
                        "900.00", MetodoPago.MASTERCARD, EstadoPago.COMPLETADO, "culqi_ch_9921029", ahora.minusDays(2)),
                pago(4L, 4L, "Diego Rojas", "drojas@gmail.com", 3L, "Mini depa céntrico y económico", "Lince",
                        "1680.00", MetodoPago.PLIN, EstadoPago.COMPLETADO, "bcp_ope_11223344", ahora.minusDays(1)),
                pago(5L, 5L, "Valeria Campos", "vcampos@yahoo.com", 3L, "Casa de playa remodelada", "Chorrillos",
                        "960.00", MetodoPago.YAPE, EstadoPago.PROCESANDO, null, null));
        repo.saveAll(lista);
        log.info("{} pagos de ejemplo creados.", lista.size());
    }

    private Pago pago(Long idReserva, Long idInquilino, String inquilino, String correo, Long idPropietario,
                      String departamento, String distrito, String monto, MetodoPago metodo, EstadoPago estado,
                      String referencia, LocalDateTime fechaPago) {
        BigDecimal total = new BigDecimal(monto);
        BigDecimal comision = PagoService.calcularComision(total, porcentaje);
        Pago p = new Pago();
        p.setIdReserva(idReserva);
        p.setIdInquilino(idInquilino);
        p.setInquilinoNombre(inquilino);
        p.setInquilinoCorreo(correo);
        p.setIdPropietario(idPropietario);
        p.setDepartamentoTitulo(departamento);
        p.setDistrito(distrito);
        p.setMonto(total);
        p.setComision(comision);
        p.setMontoPropietario(total.subtract(comision));
        p.setMetodo(metodo);
        p.setEstado(estado);
        p.setReferenciaPasarela(referencia);
        p.setFechaPago(fechaPago);
        return p;
    }
}
