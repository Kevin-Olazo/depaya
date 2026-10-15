package com.depaya.reservas.service;

import com.depaya.reservas.client.CancelacionPagoDTO;
import com.depaya.reservas.client.DepartamentoRemotoDTO;
import com.depaya.reservas.client.DepartamentosClient;
import com.depaya.reservas.client.PagosClient;
import com.depaya.reservas.config.UsuarioActual;
import com.depaya.reservas.dto.CancelarReservaDTO;
import com.depaya.reservas.dto.ConteoMesDTO;
import com.depaya.reservas.dto.FiltroReserva;
import com.depaya.reservas.dto.OcupadaDTO;
import com.depaya.reservas.dto.PaginaDTO;
import com.depaya.reservas.dto.ReembolsoInternoDTO;
import com.depaya.reservas.dto.ReservaActualizarDTO;
import com.depaya.reservas.dto.ReservaCrearDTO;
import com.depaya.reservas.dto.ReservaDTO;
import com.depaya.reservas.dto.ResumenAlquileresDTO;
import com.depaya.reservas.dto.ResumenReservasDTO;
import com.depaya.reservas.model.EstadoReembolso;
import com.depaya.reservas.model.EstadoReserva;
import com.depaya.reservas.model.Reserva;
import com.depaya.reservas.repository.ReservaRepository;
import com.depaya.reservas.repository.ReservaSpecs;
import com.depaya.reservas.util.Csv;
import com.depaya.reservas.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private static final List<EstadoReserva> ACTIVAS = List.of(EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA);
    private static final Set<String> ORDEN = Set.of("id", "fechaIngreso", "fechaSalida", "total", "fechaCreacion", "estado", "noches");
    private static final Sort ORDEN_DEFECTO = Sort.by(Sort.Direction.DESC, "fechaCreacion", "id");

    private final ReservaRepository repo;
    private final DepartamentosClient departamentos;
    private final PagosClient pagos;

    @Value("${depaya.reembolso.horas-limite:48}")
    private long horasLimite;

    // ---------------------------------------------------------------- consultas

    @Transactional(readOnly = true)
    public PaginaDTO<ReservaDTO> misReservas(FiltroReserva f, UsuarioActual actor) {
        f.setIdInquilino(actor.getId());
        return listar(f);
    }

    @Transactional(readOnly = true)
    public PaginaDTO<ReservaDTO> misAlquileres(FiltroReserva f, UsuarioActual actor) {
        f.setIdPropietario(actor.getId());
        return listar(f);
    }

    @Transactional(readOnly = true)
    public PaginaDTO<ReservaDTO> administrar(FiltroReserva f) {
        return listar(f);
    }

    @Transactional(readOnly = true)
    public ReservaDTO obtener(Long id, UsuarioActual actor) {
        Reserva r = buscar(id);
        boolean permitido = esSistema(actor) || actor.esAdmin()
                || actor.getId().equals(r.getIdInquilino()) || actor.getId().equals(r.getIdPropietario());
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a esta reserva.");
        }
        return aDTO(r);
    }

    // Rangos ocupados desde hoy (calendario).
    @Transactional(readOnly = true)
    public List<OcupadaDTO> ocupadas(Long idDepartamento) {
        return repo.ocupadas(idDepartamento, ACTIVAS, LocalDate.now()).stream()
                .map(r -> new OcupadaDTO(r.getFechaIngreso(), r.getFechaSalida(), r.getEstado()))
                .toList();
    }

    // Ids de departamentos ocupados en [desde, hasta).
    @Transactional(readOnly = true)
    public List<Long> idsOcupados(LocalDate desde, LocalDate hasta, Long idDepartamento) {
        if (!hasta.isAfter(desde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hasta debe ser posterior a desde.");
        }
        return repo.idsOcupados(ACTIVAS, desde, hasta, idDepartamento == null ? 0L : idDepartamento);
    }

    @Transactional(readOnly = true)
    public ResumenReservasDTO resumen() {
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoReserva e : EstadoReserva.values()) {
            porEstado.put(e.name(), 0L);
        }
        long total = 0;
        for (Object[] fila : repo.contarPorEstado()) {
            long n = ((Number) fila[1]).longValue();
            porEstado.put(((EstadoReserva) fila[0]).name(), n);
            total += n;
        }
        List<ConteoMesDTO> meses = new ArrayList<>();
        for (Object[] fila : repo.contarPorMes()) {
            meses.add(new ConteoMesDTO(
                    String.format("%04d-%02d", ((Number) fila[0]).intValue(), ((Number) fila[1]).intValue()),
                    ((Number) fila[2]).longValue()));
        }
        Map<String, Long> top = new LinkedHashMap<>();
        for (Object[] fila : repo.topDistritos(PageRequest.of(0, 5))) {
            top.put((String) fila[0], ((Number) fila[1]).longValue());
        }
        BigDecimal valor = repo.sumarTotal(EstadoReserva.CONFIRMADA);
        Long noches = repo.sumarNoches(EstadoReserva.CONFIRMADA);
        return new ResumenReservasDTO(total, porEstado, repo.contarReembolsosPendientes(),
                valor == null ? BigDecimal.ZERO : valor, noches == null ? 0 : noches, meses, top);
    }

    @Transactional(readOnly = true)
    public ResumenAlquileresDTO resumenAlquileres(UsuarioActual actor) {
        long pendientes = 0;
        long confirmadas = 0;
        long canceladas = 0;
        for (Object[] fila : repo.contarPorEstadoDelPropietario(actor.getId())) {
            long n = ((Number) fila[1]).longValue();
            switch ((EstadoReserva) fila[0]) {
                case PENDIENTE -> pendientes = n;
                case CONFIRMADA -> confirmadas = n;
                case CANCELADA -> canceladas = n;
            }
        }
        Long huespedes = repo.sumarHuespedesProximos(actor.getId(), ACTIVAS, LocalDate.now());
        return new ResumenAlquileresDTO(pendientes + confirmadas + canceladas, pendientes, confirmadas, canceladas,
                huespedes == null ? 0 : huespedes);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportar(FiltroReserva f) {
        List<Reserva> lista = repo.findAll(ReservaSpecs.filtrar(f), Paginacion.paraExportar(ORDEN_DEFECTO)).getContent();
        List<List<Object>> filas = new ArrayList<>();
        for (Reserva r : lista) {
            filas.add(Arrays.asList(r.getId(), r.getIdDepartamento(), r.getDepartamentoTitulo(), r.getDistrito(),
                    r.getCategoria(), r.getIdInquilino(), r.getInquilinoNombre(), r.getInquilinoCorreo(),
                    r.getIdPropietario(), r.getPropietarioNombre(), r.getFechaIngreso(), r.getFechaSalida(),
                    r.getNoches(), r.getCantidadHuespedes(), r.getPrecioNoche(), r.getTotal(), r.getEstado(),
                    r.getEstadoReembolso(), r.getMetodoReembolso(), r.getFechaCreacion(), r.getFechaCancelacion()));
        }
        return Csv.respuesta("reservas.csv",
                List.of("id", "idDepartamento", "departamento", "distrito", "categoria", "idInquilino", "inquilino",
                        "correoInquilino", "idPropietario", "propietario", "fechaIngreso", "fechaSalida", "noches",
                        "huespedes", "precioNoche", "total", "estado", "estadoReembolso", "metodoReembolso",
                        "fechaCreacion", "fechaCancelacion"),
                filas);
    }

    // ------------------------------------------------------------- escritura

    @Transactional
    public ReservaDTO crear(ReservaCrearDTO dto, UsuarioActual actor) {
        validarFechas(dto.getFechaIngreso(), dto.getFechaSalida());
        DepartamentoRemotoDTO dep = departamentos.obtener(dto.getIdDepartamento())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departamento no encontrado."));
        if (!"DISPONIBLE".equals(dep.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El departamento no está disponible para reservar.");
        }
        if (actor.getId().equals(dep.getIdPropietario())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes reservar tu propio departamento.");
        }
        validarCapacidad(dto.getCantidadHuespedes(), dep);
        validarDisponibilidad(dep.getId(), dto.getFechaIngreso(), dto.getFechaSalida(), -1L);

        Reserva r = new Reserva();
        r.setIdDepartamento(dep.getId());
        r.setIdInquilino(actor.getId());
        r.setIdPropietario(dep.getIdPropietario());
        r.setDepartamentoTitulo(dep.getTitulo());
        r.setDistrito(dep.getDistrito());
        r.setCategoria(dep.getCategoria());
        r.setImagenUrl(dep.getImagenUrl());
        r.setInquilinoNombre(actor.getNombre());
        r.setInquilinoCorreo(actor.getCorreo());
        r.setPropietarioNombre(dep.getPropietarioNombre());
        r.setPrecioNoche(dep.getPrecioNoche());
        asignarEstadia(r, dto.getFechaIngreso(), dto.getFechaSalida(), dto.getCantidadHuespedes());
        return aDTO(repo.save(r));
    }

    // Solo si está PENDIENTE. Recalcula noches y total.
    @Transactional
    public ReservaDTO actualizar(Long id, ReservaActualizarDTO dto, UsuarioActual actor) {
        Reserva r = buscar(id);
        verificarInquilinoOAdmin(r, actor);
        if (r.getEstado() != EstadoReserva.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede editar una reserva PENDIENTE.");
        }
        validarFechas(dto.getFechaIngreso(), dto.getFechaSalida());
        DepartamentoRemotoDTO dep = departamentos.obtener(r.getIdDepartamento())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departamento no encontrado."));
        validarCapacidad(dto.getCantidadHuespedes(), dep);
        validarDisponibilidad(r.getIdDepartamento(), dto.getFechaIngreso(), dto.getFechaSalida(), r.getId());
        asignarEstadia(r, dto.getFechaIngreso(), dto.getFechaSalida(), dto.getCantidadHuespedes());
        return aDTO(repo.save(r));
    }

    // Cancela la reserva. Hay reembolso si estaba CONFIRMADA y falta 1 día o más.
    @Transactional
    public ReservaDTO cancelar(Long id, CancelarReservaDTO dto, UsuarioActual actor) {
        Reserva r = buscar(id);
        verificarInquilinoOAdmin(r, actor);
        if (r.getEstado() == EstadoReserva.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya está cancelada.");
        }
        LocalDateTime ahora = LocalDateTime.now();
        boolean conReembolso = r.getEstado() == EstadoReserva.CONFIRMADA
                && ChronoUnit.DAYS.between(LocalDate.now(), r.getFechaIngreso()) >= 1;
        var metodo = dto == null ? null : dto.getMetodoReembolso();
        LocalDateTime limite = ahora.plusHours(horasLimite);

        // Primero se avisa a pagos; si falla, no se cancela.
        pagos.notificarCancelacion(r.getId(), new CancelacionPagoDTO(conReembolso, ahora, limite, metodo));

        r.setEstado(EstadoReserva.CANCELADA);
        r.setFechaCancelacion(ahora);
        if (conReembolso) {
            r.setEstadoReembolso(EstadoReembolso.PENDIENTE);
            r.setMetodoReembolso(metodo);
            r.setFechaSolicitudReembolso(ahora);
            r.setFechaLimiteReembolso(limite);
        } else {
            r.setEstadoReembolso(EstadoReembolso.NO_APLICA);
        }
        return aDTO(repo.save(r));
    }

    @Transactional
    public void eliminar(Long id) {
        Reserva r = buscar(id);
        if (r.getEstado() == EstadoReserva.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar una reserva CONFIRMADA. Cancélala primero.");
        }
        repo.delete(r);
    }

    // -------------------------------------------------- uso interno (SISTEMA)

    // ms-pagos avisa que el pago se completó.
    @Transactional
    public ReservaDTO confirmar(Long id) {
        Reserva r = buscar(id);
        if (r.getEstado() == EstadoReserva.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva está cancelada y no se puede confirmar.");
        }
        r.setEstado(EstadoReserva.CONFIRMADA);
        return aDTO(repo.save(r));
    }

    // ms-pagos avisa si el reembolso se devolvió (DEVUELTO) o se rechazó (NO_APLICA).
    @Transactional
    public ReservaDTO actualizarReembolso(Long id, ReembolsoInternoDTO dto) {
        Reserva r = buscar(id);
        r.setEstadoReembolso(dto.getEstadoReembolso());
        if (dto.getEstadoReembolso() == EstadoReembolso.DEVUELTO) {
            r.setFechaReembolso(dto.getFechaReembolso() != null ? dto.getFechaReembolso() : LocalDateTime.now());
        } else if (dto.getEstadoReembolso() == EstadoReembolso.NO_APLICA) {
            r.setFechaSolicitudReembolso(null);
            r.setFechaLimiteReembolso(null);
            r.setFechaReembolso(null);
        }
        return aDTO(repo.save(r));
    }

    // ---------------------------------------------------------------- ayudas

    private PaginaDTO<ReservaDTO> listar(FiltroReserva f) {
        Pageable pagina = Paginacion.crear(f, ORDEN, ORDEN_DEFECTO);
        return PaginaDTO.de(repo.findAll(ReservaSpecs.filtrar(f), pagina).map(ReservaService::aDTO));
    }

    private Reserva buscar(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada."));
    }

    private static boolean esSistema(UsuarioActual actor) {
        return "SISTEMA".equals(actor.getRol());
    }

    private static void verificarInquilinoOAdmin(Reserva r, UsuarioActual actor) {
        if (!actor.esAdmin() && !actor.getId().equals(r.getIdInquilino())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta reserva no es tuya.");
        }
    }

    private static void validarFechas(LocalDate ingreso, LocalDate salida) {
        if (ingreso.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de ingreso no puede ser pasada.");
        }
        if (!salida.isAfter(ingreso)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de salida debe ser posterior a la de ingreso.");
        }
    }

    private static void validarCapacidad(int huespedes, DepartamentoRemotoDTO dep) {
        if (dep.getCapacidadPersonas() != null && huespedes > dep.getCapacidadPersonas()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El departamento admite hasta " + dep.getCapacidadPersonas() + " huésped(es).");
        }
    }

    private void validarDisponibilidad(Long idDepartamento, LocalDate ingreso, LocalDate salida, Long excluirId) {
        if (repo.existeChoque(idDepartamento, ACTIVAS, ingreso, salida, excluirId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El departamento ya está reservado en esas fechas.");
        }
    }

    private static void asignarEstadia(Reserva r, LocalDate ingreso, LocalDate salida, int huespedes) {
        long noches = ChronoUnit.DAYS.between(ingreso, salida);
        r.setFechaIngreso(ingreso);
        r.setFechaSalida(salida);
        r.setNoches((int) noches);
        r.setCantidadHuespedes(huespedes);
        r.setTotal(r.getPrecioNoche().multiply(BigDecimal.valueOf(noches)));
    }

    public static ReservaDTO aDTO(Reserva r) {
        return ReservaDTO.builder()
                .id(r.getId()).idDepartamento(r.getIdDepartamento()).idInquilino(r.getIdInquilino())
                .idPropietario(r.getIdPropietario()).departamentoTitulo(r.getDepartamentoTitulo())
                .distrito(r.getDistrito()).categoria(r.getCategoria()).imagenUrl(r.getImagenUrl())
                .inquilinoNombre(r.getInquilinoNombre()).inquilinoCorreo(r.getInquilinoCorreo())
                .propietarioNombre(r.getPropietarioNombre())
                .fechaIngreso(r.getFechaIngreso()).fechaSalida(r.getFechaSalida()).noches(r.getNoches())
                .cantidadHuespedes(r.getCantidadHuespedes()).precioNoche(r.getPrecioNoche()).total(r.getTotal())
                .estado(r.getEstado()).estadoReembolso(r.getEstadoReembolso()).metodoReembolso(r.getMetodoReembolso())
                .fechaCreacion(r.getFechaCreacion()).fechaCancelacion(r.getFechaCancelacion())
                .fechaSolicitudReembolso(r.getFechaSolicitudReembolso())
                .fechaLimiteReembolso(r.getFechaLimiteReembolso()).fechaReembolso(r.getFechaReembolso())
                .build();
    }
}
