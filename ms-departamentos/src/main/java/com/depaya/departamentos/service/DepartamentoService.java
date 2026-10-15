package com.depaya.departamentos.service;

import com.depaya.departamentos.client.AuthClient;
import com.depaya.departamentos.client.ReservasClient;
import com.depaya.departamentos.client.UsuarioRemotoDTO;
import com.depaya.departamentos.config.UsuarioActual;
import com.depaya.departamentos.dto.DepartamentoDTO;
import com.depaya.departamentos.dto.DepartamentoGuardarDTO;
import com.depaya.departamentos.dto.FiltroDepartamento;
import com.depaya.departamentos.dto.PaginaDTO;
import com.depaya.departamentos.dto.ResumenDepartamentosDTO;
import com.depaya.departamentos.model.Departamento;
import com.depaya.departamentos.model.EstadoDepartamento;
import com.depaya.departamentos.repository.DepartamentoRepository;
import com.depaya.departamentos.repository.DepartamentoSpecs;
import com.depaya.departamentos.util.Csv;
import com.depaya.departamentos.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DepartamentoService {

    public static final List<String> CATEGORIAS =
            List.of("Playa", "Moderno", "Vista al mar", "Loft", "Ejecutivo", "Familiar");

    private static final Set<String> ORDEN = Set.of(
            "id", "titulo", "precioNoche", "distrito", "capacidadPersonas", "habitaciones", "banos", "fechaPublicacion");
    private static final Sort ORDEN_DEFECTO = Sort.by(Sort.Direction.DESC, "fechaPublicacion", "id");

    private final DepartamentoRepository repo;
    private final AuthClient authClient;
    private final ReservasClient reservasClient;

    // ---------------------------------------------------------------- consultas

    // Catálogo público: solo DISPONIBLES.
    @Transactional(readOnly = true)
    public PaginaDTO<DepartamentoDTO> catalogo(FiltroDepartamento f) {
        f.setEstado(EstadoDepartamento.DISPONIBLE);
        return buscar(f);
    }

    // PROPIETARIO: solo los suyos, en cualquier estado.
    @Transactional(readOnly = true)
    public PaginaDTO<DepartamentoDTO> misDepartamentos(FiltroDepartamento f, UsuarioActual actor) {
        f.setPropietarioId(actor.getId());
        return buscar(f);
    }

    // ADMIN: todos, con cualquier filtro.
    @Transactional(readOnly = true)
    public PaginaDTO<DepartamentoDTO> administrar(FiltroDepartamento f) {
        return buscar(f);
    }

    @Transactional(readOnly = true)
    public DepartamentoDTO obtener(Long id) {
        return aDTO(buscarPorId(id));
    }

    @Transactional(readOnly = true)
    public List<String> distritos() {
        return repo.distritosConEstado(EstadoDepartamento.DISPONIBLE);
    }

    @Transactional(readOnly = true)
    public ResumenDepartamentosDTO resumen() {
        return new ResumenDepartamentosDTO(
                repo.count(),
                repo.contarPropietarios(),
                Math.round(nvl(repo.precioPromedio()) * 100.0) / 100.0,
                mapa(repo.contarPorEstado(), true),
                mapa(repo.contarPorDistrito(), false),
                mapa(repo.contarPorCategoria(), false));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportar(FiltroDepartamento f) {
        List<Long> excluir = idsOcupados(f);
        List<Departamento> lista = repo.findAll(DepartamentoSpecs.filtrar(f, excluir),
                Paginacion.paraExportar(ORDEN_DEFECTO)).getContent();
        List<List<Object>> filas = new ArrayList<>();
        for (Departamento d : lista) {
            filas.add(List.of(d.getId(), d.getTitulo(), d.getDistrito(), d.getDireccion(), d.getCategoria(),
                    d.getPrecioNoche(), d.getCapacidadPersonas(), d.getHabitaciones(), d.getBanos(),
                    d.isTienePiscina(), d.isTieneWifi(), d.isAdmiteMascotas(), d.getEstado(),
                    d.getIdPropietario(), d.getPropietarioNombre(), d.getFechaPublicacion()));
        }
        return Csv.respuesta("departamentos.csv",
                List.of("id", "titulo", "distrito", "direccion", "categoria", "precioNoche", "capacidadPersonas",
                        "habitaciones", "banos", "tienePiscina", "tieneWifi", "admiteMascotas", "estado",
                        "idPropietario", "propietarioNombre", "fechaPublicacion"),
                filas);
    }

    // ------------------------------------------------------------- escritura

    @Transactional
    public DepartamentoDTO crear(DepartamentoGuardarDTO dto, UsuarioActual actor) {
        Long idPropietario;
        if (actor.esAdmin()) {
            if (dto.getIdPropietario() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "idPropietario es obligatorio para el administrador.");
            }
            idPropietario = dto.getIdPropietario();
        } else {
            idPropietario = actor.getId();
        }
        UsuarioRemotoDTO propietario = validarPropietario(idPropietario, actor);

        Departamento d = new Departamento();
        d.setIdPropietario(idPropietario);
        d.setPropietarioNombre(nombreCompleto(propietario));
        aplicar(d, dto);
        d.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoDepartamento.DISPONIBLE);
        return aDTO(repo.save(d));
    }

    @Transactional
    public DepartamentoDTO actualizar(Long id, DepartamentoGuardarDTO dto, UsuarioActual actor) {
        Departamento d = buscarPorId(id);
        verificarDueno(d, actor);
        if (actor.esAdmin() && dto.getIdPropietario() != null && !dto.getIdPropietario().equals(d.getIdPropietario())) {
            UsuarioRemotoDTO nuevo = validarPropietario(dto.getIdPropietario(), actor);
            d.setIdPropietario(nuevo.getId());
            d.setPropietarioNombre(nombreCompleto(nuevo));
        }
        aplicar(d, dto);
        if (dto.getEstado() != null) {
            d.setEstado(dto.getEstado());
        }
        return aDTO(repo.save(d));
    }

    @Transactional
    public DepartamentoDTO cambiarEstado(Long id, EstadoDepartamento estado, UsuarioActual actor) {
        Departamento d = buscarPorId(id);
        verificarDueno(d, actor);
        d.setEstado(estado);
        return aDTO(repo.save(d));
    }

    @Transactional
    public void eliminar(Long id, UsuarioActual actor) {
        Departamento d = buscarPorId(id);
        verificarDueno(d, actor);
        List<Long> conReservas = reservasClient.idsOcupados(LocalDate.now(), LocalDate.of(9999, 12, 31), id);
        if (!conReservas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El departamento tiene reservas activas. Cancélalas o desactiva el departamento.");
        }
        repo.delete(d);
    }

    // Pasa a INACTIVO o DISPONIBLE todos los departamentos de un propietario.
    @Transactional
    public int activarODesactivarDelPropietario(Long idPropietario, boolean activo, UsuarioActual actor) {
        if (!actor.esAdmin() && !actor.getId().equals(idPropietario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes gestionar tus propios departamentos.");
        }
        return activo
                ? repo.reactivarDelPropietario(idPropietario, EstadoDepartamento.INACTIVO, EstadoDepartamento.DISPONIBLE)
                : repo.cambiarEstadoDelPropietario(idPropietario, EstadoDepartamento.INACTIVO);
    }

    // ---------------------------------------------------------------- ayudas

    private PaginaDTO<DepartamentoDTO> buscar(FiltroDepartamento f) {
        Pageable pagina = Paginacion.crear(f, ORDEN, ORDEN_DEFECTO);
        List<Long> excluir = idsOcupados(f);
        return PaginaDTO.de(repo.findAll(DepartamentoSpecs.filtrar(f, excluir), pagina).map(DepartamentoService::aDTO));
    }

    // Con desde y hasta, consulta a ms-reservas cuáles están ocupados.
    private List<Long> idsOcupados(FiltroDepartamento f) {
        if (f.getDesde() == null && f.getHasta() == null) {
            return List.of();
        }
        if (f.getDesde() == null || f.getHasta() == null || !f.getHasta().isAfter(f.getDesde())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para filtrar por fechas libres envía desde y hasta, y hasta debe ser posterior a desde.");
        }
        return reservasClient.idsOcupados(f.getDesde(), f.getHasta(), null);
    }

    private UsuarioRemotoDTO validarPropietario(Long idPropietario, UsuarioActual actor) {
        UsuarioRemotoDTO u = authClient.obtener(idPropietario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El propietario indicado no existe."));
        if (!"PROPIETARIO".equals(u.getRol())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario indicado no tiene rol PROPIETARIO.");
        }
        if (!u.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La cuenta del propietario está desactivada.");
        }
        if (!u.isPublicacionesHabilitadas() && !actor.esAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tus publicaciones están bloqueadas. Contacta al administrador.");
        }
        return u;
    }

    private void verificarDueno(Departamento d, UsuarioActual actor) {
        if (!actor.esAdmin() && !d.getIdPropietario().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este departamento no es tuyo.");
        }
    }

    private Departamento buscarPorId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Departamento no encontrado."));
    }

    private static void aplicar(Departamento d, DepartamentoGuardarDTO dto) {
        d.setTitulo(dto.getTitulo().trim());
        d.setDescripcion(dto.getDescripcion().trim());
        d.setDistrito(dto.getDistrito().trim());
        d.setDireccion(dto.getDireccion().trim());
        d.setCategoria(dto.getCategoria());
        d.setLatitud(dto.getLatitud());
        d.setLongitud(dto.getLongitud());
        d.setPrecioNoche(dto.getPrecioNoche());
        d.setCapacidadPersonas(dto.getCapacidadPersonas());
        d.setHabitaciones(dto.getHabitaciones());
        d.setBanos(dto.getBanos());
        d.setImagenUrl(dto.getImagenUrl().trim());
        d.setTienePiscina(dto.isTienePiscina());
        d.setTieneWifi(dto.isTieneWifi());
        d.setAdmiteMascotas(dto.isAdmiteMascotas());
    }

    private static String nombreCompleto(UsuarioRemotoDTO u) {
        return (u.getNombre() + " " + (u.getApellido() == null ? "" : u.getApellido())).trim();
    }

    private static double nvl(Double valor) {
        return valor == null ? 0.0 : valor;
    }

    private static Map<String, Long> mapa(List<Object[]> filas, boolean todosLosEstados) {
        Map<String, Long> resultado = new LinkedHashMap<>();
        if (todosLosEstados) {
            for (EstadoDepartamento e : EstadoDepartamento.values()) {
                resultado.put(e.name(), 0L);
            }
        }
        for (Object[] fila : filas) {
            resultado.put(String.valueOf(fila[0]), ((Number) fila[1]).longValue());
        }
        return resultado;
    }

    public static DepartamentoDTO aDTO(Departamento d) {
        return DepartamentoDTO.builder()
                .id(d.getId()).idPropietario(d.getIdPropietario()).propietarioNombre(d.getPropietarioNombre())
                .titulo(d.getTitulo()).descripcion(d.getDescripcion()).distrito(d.getDistrito())
                .direccion(d.getDireccion()).categoria(d.getCategoria())
                .latitud(d.getLatitud()).longitud(d.getLongitud()).precioNoche(d.getPrecioNoche())
                .capacidadPersonas(d.getCapacidadPersonas()).habitaciones(d.getHabitaciones()).banos(d.getBanos())
                .imagenUrl(d.getImagenUrl()).tienePiscina(d.isTienePiscina()).tieneWifi(d.isTieneWifi())
                .admiteMascotas(d.isAdmiteMascotas()).estado(d.getEstado()).fechaPublicacion(d.getFechaPublicacion())
                .build();
    }
}
