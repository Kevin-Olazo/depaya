package com.depaya.pagos.service;

import com.depaya.pagos.client.ReembolsoReservaDTO;
import com.depaya.pagos.client.ReservaRemotaDTO;
import com.depaya.pagos.client.ReservasClient;
import com.depaya.pagos.config.UsuarioActual;
import com.depaya.pagos.dto.CancelacionReservaDTO;
import com.depaya.pagos.dto.FiltroPago;
import com.depaya.pagos.dto.PagoActualizarDTO;
import com.depaya.pagos.dto.PagoCrearDTO;
import com.depaya.pagos.dto.PagoDTO;
import com.depaya.pagos.dto.PaginaDTO;
import com.depaya.pagos.dto.ResumenIngresosDTO;
import com.depaya.pagos.dto.ResumenPagosDTO;
import com.depaya.pagos.dto.TotalesDTO;
import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.Pago;
import com.depaya.pagos.repository.PagoRepository;
import com.depaya.pagos.repository.PagoSpecs;
import com.depaya.pagos.util.Csv;
import com.depaya.pagos.util.Paginacion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagoService {

    private static final Set<String> ORDEN = Set.of("id", "monto", "estado", "metodo", "fechaCreacion", "fechaPago");
    private static final Sort ORDEN_DEFECTO = Sort.by(Sort.Direction.DESC, "fechaCreacion", "id");
    private static final List<EstadoPago> EN_CURSO = List.of(
            EstadoPago.PROCESANDO, EstadoPago.COMPLETADO, EstadoPago.REEMBOLSO_PENDIENTE);

    private final PagoRepository repo;
    private final ReservasClient reservas;

    @Value("${depaya.comision.porcentaje:10}")
    private BigDecimal porcentajeComision;

    // ---------------------------------------------------------------- consultas

    @Transactional(readOnly = true)
    public PaginaDTO<PagoDTO> misPagos(FiltroPago f, UsuarioActual actor) {
        f.setIdInquilino(actor.getId());
        return listar(f);
    }

    @Transactional(readOnly = true)
    public PaginaDTO<PagoDTO> misIngresos(FiltroPago f, UsuarioActual actor) {
        f.setIdPropietario(actor.getId());
        return listar(f);
    }

    @Transactional(readOnly = true)
    public PaginaDTO<PagoDTO> administrar(FiltroPago f) {
        return listar(f);
    }

    @Transactional(readOnly = true)
    public PagoDTO obtener(Long id, UsuarioActual actor) {
        Pago p = buscar(id);
        boolean permitido = actor.esAdmin() || actor.getId().equals(p.getIdInquilino())
                || actor.getId().equals(p.getIdPropietario());
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este pago.");
        }
        return aDTO(p);
    }

    // Ingresos del propietario: solo pagos COMPLETADO.
    @Transactional(readOnly = true)
    public ResumenIngresosDTO resumenIngresos(UsuarioActual actor) {
        TotalesDTO t = repo.totales(EstadoPago.COMPLETADO, actor.getId());
        long pendientes = repo.count(PagoSpecs.filtrar(filtro(EstadoPago.REEMBOLSO_PENDIENTE, actor.getId())));
        return new ResumenIngresosDTO(t.getCantidad(), t.getMonto(), t.getComision(), t.getMontoPropietario(),
                pendientes, porcentajeComision);
    }

    @Transactional(readOnly = true)
    public ResumenPagosDTO resumen() {
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoPago e : EstadoPago.values()) {
            porEstado.put(e.name(), 0L);
        }
        long total = 0;
        for (Object[] fila : repo.contarPorEstado()) {
            long n = ((Number) fila[1]).longValue();
            porEstado.put(((EstadoPago) fila[0]).name(), n);
            total += n;
        }
        TotalesDTO completados = repo.totales(EstadoPago.COMPLETADO, 0L);
        TotalesDTO pendientes = repo.totales(EstadoPago.REEMBOLSO_PENDIENTE, 0L);
        Map<String, BigDecimal> porMetodo = new LinkedHashMap<>();
        for (Object[] fila : repo.ingresosPorMetodo()) {
            porMetodo.put(String.valueOf(fila[0]), (BigDecimal) fila[1]);
        }
        Map<String, BigDecimal> porMes = new LinkedHashMap<>();
        for (Object[] fila : repo.ingresosPorMes()) {
            porMes.put(String.format("%04d-%02d", ((Number) fila[0]).intValue(), ((Number) fila[1]).intValue()),
                    (BigDecimal) fila[2]);
        }
        return new ResumenPagosDTO(total, porEstado, completados.getMonto(), completados.getComision(),
                completados.getMontoPropietario(), pendientes.getCantidad(), pendientes.getMonto(),
                porMetodo, porMes, porcentajeComision);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportar(FiltroPago f) {
        List<Pago> lista = repo.findAll(PagoSpecs.filtrar(f), Paginacion.paraExportar(ORDEN_DEFECTO)).getContent();
        List<List<Object>> filas = new ArrayList<>();
        for (Pago p : lista) {
            filas.add(Arrays.asList(p.getId(), p.getIdReserva(), p.getDepartamentoTitulo(), p.getDistrito(),
                    p.getIdInquilino(), p.getInquilinoNombre(), p.getInquilinoCorreo(), p.getIdPropietario(),
                    p.getMonto(), p.getComision(), p.getMontoPropietario(), p.getMoneda(), p.getMetodo(),
                    p.getEstado(), p.getReferenciaPasarela(), p.getFechaCreacion(), p.getFechaPago(),
                    p.getFechaSolicitudReembolso(), p.getFechaReembolso()));
        }
        return Csv.respuesta("pagos.csv",
                List.of("id", "idReserva", "departamento", "distrito", "idInquilino", "inquilino", "correoInquilino",
                        "idPropietario", "monto", "comision", "montoPropietario", "moneda", "metodo", "estado",
                        "referenciaPasarela", "fechaCreacion", "fechaPago", "fechaSolicitudReembolso", "fechaReembolso"),
                filas);
    }

    // ------------------------------------------------------------- escritura

    // Crea el pago PROCESANDO con el total de la reserva.
    @Transactional
    public PagoDTO crear(PagoCrearDTO dto, UsuarioActual actor) {
        ReservaRemotaDTO r = reservas.obtener(dto.getIdReserva())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada."));
        if (!actor.getId().equals(r.getIdInquilino())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta reserva no es tuya.");
        }
        if (!"PENDIENTE".equals(r.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede pagar una reserva PENDIENTE.");
        }
        if (repo.existsByIdReservaAndEstadoIn(r.getId(), EN_CURSO)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya tiene un pago en curso o completado.");
        }
        Pago p = new Pago();
        p.setIdReserva(r.getId());
        p.setIdInquilino(r.getIdInquilino());
        p.setInquilinoNombre(r.getInquilinoNombre());
        p.setInquilinoCorreo(r.getInquilinoCorreo());
        p.setIdPropietario(r.getIdPropietario());
        p.setDepartamentoTitulo(r.getDepartamentoTitulo());
        p.setDistrito(r.getDistrito());
        p.setMonto(r.getTotal());
        p.setComision(calcularComision(r.getTotal(), porcentajeComision));
        p.setMontoPropietario(r.getTotal().subtract(p.getComision()));
        p.setMetodo(dto.getMetodo());
        return aDTO(repo.save(p));
    }

    // Simula la pasarela: PROCESANDO a COMPLETADO y la reserva a CONFIRMADA.
    @Transactional
    public PagoDTO confirmar(Long id, UsuarioActual actor) {
        Pago p = buscar(id);
        verificarPagadorOAdmin(p, actor);
        if (p.getEstado() != EstadoPago.PROCESANDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede confirmar un pago PROCESANDO.");
        }
        ReservaRemotaDTO r = reservas.obtener(p.getIdReserva())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya no existe."));
        if (!"PENDIENTE".equals(r.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya no está pendiente (¿fue cancelada?).");
        }
        if (r.getTotal().compareTo(p.getMonto()) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El total de la reserva cambió. Cancela este pago y crea uno nuevo.");
        }
        p.setEstado(EstadoPago.COMPLETADO);
        p.setFechaPago(LocalDateTime.now());
        p.setReferenciaPasarela("SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        reservas.confirmar(p.getIdReserva()); // si falla, se deshace el cambio
        return aDTO(repo.save(p));
    }

    // El pagador cancela un pago PROCESANDO.
    @Transactional
    public PagoDTO cancelar(Long id, UsuarioActual actor) {
        Pago p = buscar(id);
        verificarPagadorOAdmin(p, actor);
        if (p.getEstado() != EstadoPago.PROCESANDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede cancelar un pago PROCESANDO.");
        }
        p.setEstado(EstadoPago.CANCELADO);
        return aDTO(repo.save(p));
    }

    // ADMIN. Corrige método o referencia de un pago PROCESANDO o COMPLETADO.
    @Transactional
    public PagoDTO actualizar(Long id, PagoActualizarDTO dto) {
        Pago p = buscar(id);
        if (p.getEstado() != EstadoPago.PROCESANDO && p.getEstado() != EstadoPago.COMPLETADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede editar un pago PROCESANDO o COMPLETADO.");
        }
        p.setMetodo(dto.getMetodo());
        p.setReferenciaPasarela(dto.getReferenciaPasarela());
        return aDTO(repo.save(p));
    }

    @Transactional
    public void eliminar(Long id) {
        Pago p = buscar(id);
        if (p.getEstado() == EstadoPago.COMPLETADO || p.getEstado() == EstadoPago.REEMBOLSO_PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar un pago COMPLETADO o con reembolso pendiente.");
        }
        repo.delete(p);
    }

    // ADMIN. Confirma que el dinero se devolvió.
    @Transactional
    public PagoDTO confirmarReembolso(Long id) {
        Pago p = buscar(id);
        exigirReembolsoPendiente(p);
        return aprobarReembolso(p);
    }

    // ADMIN. Rechaza el reembolso: el pago vuelve a COMPLETADO.
    @Transactional
    public PagoDTO rechazarReembolso(Long id) {
        Pago p = buscar(id);
        exigirReembolsoPendiente(p);
        reservas.actualizarReembolso(p.getIdReserva(), new ReembolsoReservaDTO("NO_APLICA", null));
        p.setEstado(EstadoPago.COMPLETADO);
        p.setFechaSolicitudReembolso(null);
        p.setFechaLimiteReembolso(null);
        p.setFechaReembolso(null);
        p.setMetodoReembolso(null);
        return aDTO(repo.save(p));
    }

    // ms-reservas avisa que la reserva se canceló.
    @Transactional
    public void reservaCancelada(Long idReserva, CancelacionReservaDTO dto) {
        Pago p = repo.findFirstByIdReservaAndEstadoInOrderByIdDesc(idReserva,
                List.of(EstadoPago.PROCESANDO, EstadoPago.COMPLETADO)).orElse(null);
        if (p == null) {
            return;
        }
        if (p.getEstado() == EstadoPago.PROCESANDO) {
            p.setEstado(EstadoPago.CANCELADO);
        } else if (dto.isConReembolso()) {
            LocalDateTime ahora = LocalDateTime.now();
            p.setEstado(EstadoPago.REEMBOLSO_PENDIENTE);
            p.setFechaSolicitudReembolso(dto.getFechaSolicitud() != null ? dto.getFechaSolicitud() : ahora);
            p.setFechaLimiteReembolso(dto.getFechaLimite() != null ? dto.getFechaLimite() : ahora.plusHours(48));
            p.setMetodoReembolso(dto.getMetodoReembolso() != null ? dto.getMetodoReembolso() : p.getMetodo());
        }
        // COMPLETADO sin reembolso: fuera de plazo, no cambia.
        repo.save(p);
    }

    // Aprueba los reembolsos vencidos. Lo llama el proceso programado.
    @Transactional
    public int procesarReembolsosVencidos() {
        List<Pago> vencidos = repo.findByEstadoAndFechaLimiteReembolsoLessThanEqual(
                EstadoPago.REEMBOLSO_PENDIENTE, LocalDateTime.now());
        int procesados = 0;
        for (Pago p : vencidos) {
            try {
                aprobarReembolso(p);
                procesados++;
            } catch (RuntimeException e) {
                log.warn("No se pudo aprobar el reembolso del pago {}: {}", p.getId(), e.getMessage());
            }
        }
        return procesados;
    }

    // ---------------------------------------------------------------- ayudas

    private PagoDTO aprobarReembolso(Pago p) {
        LocalDateTime ahora = LocalDateTime.now();
        reservas.actualizarReembolso(p.getIdReserva(), new ReembolsoReservaDTO("DEVUELTO", ahora));
        p.setEstado(EstadoPago.REEMBOLSADO);
        p.setFechaReembolso(ahora);
        return aDTO(repo.save(p));
    }

    private PaginaDTO<PagoDTO> listar(FiltroPago f) {
        Pageable pagina = Paginacion.crear(f, ORDEN, ORDEN_DEFECTO);
        return PaginaDTO.de(repo.findAll(PagoSpecs.filtrar(f), pagina).map(PagoService::aDTO));
    }

    private static FiltroPago filtro(EstadoPago estado, Long idPropietario) {
        FiltroPago f = new FiltroPago();
        f.setEstado(estado);
        f.setIdPropietario(idPropietario);
        return f;
    }

    private Pago buscar(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado."));
    }

    private static void verificarPagadorOAdmin(Pago p, UsuarioActual actor) {
        if (!actor.esAdmin() && !actor.getId().equals(p.getIdInquilino())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este pago no es tuyo.");
        }
    }

    private static void exigirReembolsoPendiente(Pago p) {
        if (p.getEstado() != EstadoPago.REEMBOLSO_PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pago no tiene un reembolso pendiente.");
        }
    }

    // monto * porcentaje / 100, con 2 decimales.
    public static BigDecimal calcularComision(BigDecimal monto, BigDecimal porcentaje) {
        return monto.multiply(porcentaje).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public static PagoDTO aDTO(Pago p) {
        return PagoDTO.builder()
                .id(p.getId()).idReserva(p.getIdReserva()).idInquilino(p.getIdInquilino())
                .inquilinoNombre(p.getInquilinoNombre()).inquilinoCorreo(p.getInquilinoCorreo())
                .idPropietario(p.getIdPropietario()).departamentoTitulo(p.getDepartamentoTitulo())
                .distrito(p.getDistrito()).monto(p.getMonto()).comision(p.getComision())
                .montoPropietario(p.getMontoPropietario()).moneda(p.getMoneda()).metodo(p.getMetodo())
                .estado(p.getEstado()).referenciaPasarela(p.getReferenciaPasarela())
                .metodoReembolso(p.getMetodoReembolso()).fechaCreacion(p.getFechaCreacion())
                .fechaPago(p.getFechaPago()).fechaSolicitudReembolso(p.getFechaSolicitudReembolso())
                .fechaLimiteReembolso(p.getFechaLimiteReembolso()).fechaReembolso(p.getFechaReembolso())
                .build();
    }
}
