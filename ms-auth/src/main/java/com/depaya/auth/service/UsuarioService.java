package com.depaya.auth.service;

import com.depaya.auth.config.UsuarioActual;
import com.depaya.auth.dto.ConteoMesDTO;
import com.depaya.auth.dto.EstadoUsuarioDTO;
import com.depaya.auth.dto.FiltroUsuario;
import com.depaya.auth.dto.PaginaDTO;
import com.depaya.auth.dto.ResumenUsuariosDTO;
import com.depaya.auth.dto.UsuarioActualizarDTO;
import com.depaya.auth.dto.UsuarioCrearDTO;
import com.depaya.auth.dto.UsuarioDTO;
import com.depaya.auth.dto.UsuarioPublicoDTO;
import com.depaya.auth.model.Rol;
import com.depaya.auth.model.Usuario;
import com.depaya.auth.repository.UsuarioRepository;
import com.depaya.auth.repository.UsuarioSpecs;
import com.depaya.auth.util.Csv;
import com.depaya.auth.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final Set<String> ORDEN = Set.of("id", "nombre", "apellido", "correo", "rol", "fechaRegistro");
    private static final Sort ORDEN_DEFECTO = Sort.by(Sort.Direction.DESC, "id");

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;

    @Transactional(readOnly = true)
    public PaginaDTO<UsuarioDTO> listar(FiltroUsuario filtro) {
        Pageable pagina = Paginacion.crear(filtro, ORDEN, ORDEN_DEFECTO);
        return PaginaDTO.de(repo.findAll(UsuarioSpecs.filtrar(filtro), pagina).map(UsuarioService::aDTO));
    }

    @Transactional(readOnly = true)
    public UsuarioDTO obtener(Long id) {
        return aDTO(buscar(id));
    }

    @Transactional(readOnly = true)
    public UsuarioPublicoDTO publico(Long id) {
        Usuario u = buscar(id);
        return UsuarioPublicoDTO.builder()
                .id(u.getId()).nombre(u.getNombre()).apellido(u.getApellido()).rol(u.getRol())
                .activo(u.isActivo()).publicacionesHabilitadas(u.isPublicacionesHabilitadas())
                .build();
    }

    @Transactional
    public UsuarioDTO crear(UsuarioCrearDTO dto) {
        validarUnicos(dto.getCorreo(), dto.getNumeroDocumento(), null);
        Usuario u = new Usuario();
        u.setNombre(dto.getNombre().trim());
        u.setApellido(dto.getApellido().trim());
        u.setTipoDocumento(dto.getTipoDocumento());
        u.setNumeroDocumento(dto.getNumeroDocumento().trim());
        u.setCorreo(dto.getCorreo().trim().toLowerCase());
        u.setTelefono(dto.getTelefono().trim());
        u.setPassword(encoder.encode(dto.getPassword()));
        u.setRol(dto.getRol());
        return aDTO(repo.save(u));
    }

    @Transactional
    public UsuarioDTO actualizar(Long id, UsuarioActualizarDTO dto, UsuarioActual actor) {
        Usuario u = buscar(id);
        if (dto.getRol() != null && dto.getRol() != u.getRol() && !actor.esAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede cambiar el rol.");
        }
        validarUnicos(dto.getCorreo(), dto.getNumeroDocumento(), id);
        u.setNombre(dto.getNombre().trim());
        u.setApellido(dto.getApellido().trim());
        u.setTipoDocumento(dto.getTipoDocumento());
        u.setNumeroDocumento(dto.getNumeroDocumento().trim());
        u.setCorreo(dto.getCorreo().trim().toLowerCase());
        u.setTelefono(dto.getTelefono().trim());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            u.setPassword(encoder.encode(dto.getPassword()));
        }
        if (dto.getRol() != null) {
            u.setRol(dto.getRol());
        }
        return aDTO(repo.save(u));
    }

    @Transactional
    public UsuarioDTO cambiarEstado(Long id, EstadoUsuarioDTO dto, UsuarioActual actor) {
        Usuario u = buscar(id);
        if (dto.getActivo() != null) {
            if (!dto.getActivo() && u.getId().equals(actor.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes desactivar tu propia cuenta.");
            }
            u.setActivo(dto.getActivo());
            u.setFechaDesactivacion(dto.getActivo() ? null : LocalDateTime.now());
            if (dto.getPublicacionesHabilitadas() == null) {
                // Reactivar habilita publicar; desactivar a un propietario lo bloquea.
                if (dto.getActivo()) {
                    u.setPublicacionesHabilitadas(true);
                } else if (u.getRol() == Rol.PROPIETARIO) {
                    u.setPublicacionesHabilitadas(false);
                }
            }
        }
        if (dto.getPublicacionesHabilitadas() != null) {
            u.setPublicacionesHabilitadas(dto.getPublicacionesHabilitadas());
        }
        return aDTO(repo.save(u));
    }

    // El propio usuario desactiva su cuenta. El ADMIN puede reactivarla.
    @Transactional
    public UsuarioDTO desactivarMiCuenta(UsuarioActual actor) {
        Usuario u = buscar(actor.getId());
        if (u.getRol() == Rol.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un administrador no puede desactivar su cuenta.");
        }
        u.setActivo(false);
        u.setPublicacionesHabilitadas(false);
        u.setFechaDesactivacion(LocalDateTime.now());
        return aDTO(repo.save(u));
    }

    @Transactional
    public void eliminar(Long id, UsuarioActual actor) {
        Usuario u = buscar(id);
        if (u.getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes eliminar tu propia cuenta.");
        }
        repo.delete(u);
    }

    @Transactional(readOnly = true)
    public ResumenUsuariosDTO resumen() {
        Map<String, Long> porRol = new LinkedHashMap<>();
        for (Rol r : Rol.values()) {
            porRol.put(r.name(), 0L);
        }
        for (Object[] fila : repo.contarPorRol()) {
            porRol.put(((Rol) fila[0]).name(), ((Number) fila[1]).longValue());
        }
        List<ConteoMesDTO> meses = new ArrayList<>();
        for (Object[] fila : repo.contarPorMes()) {
            meses.add(new ConteoMesDTO(
                    String.format("%04d-%02d", ((Number) fila[0]).intValue(), ((Number) fila[1]).intValue()),
                    ((Number) fila[2]).longValue()));
        }
        long activos = repo.countByActivo(true);
        long inactivos = repo.countByActivo(false);
        return new ResumenUsuariosDTO(activos + inactivos, activos, inactivos, porRol, meses);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportar(FiltroUsuario filtro) {
        List<Usuario> usuarios = repo.findAll(UsuarioSpecs.filtrar(filtro), Paginacion.paraExportar(ORDEN_DEFECTO)).getContent();
        List<List<Object>> filas = new ArrayList<>();
        for (Usuario u : usuarios) {
            filas.add(List.of(u.getId(), u.getNombre(), u.getApellido(), u.getTipoDocumento(), u.getNumeroDocumento(),
                    u.getCorreo(), u.getTelefono(), u.getRol(), u.isActivo(), u.isPublicacionesHabilitadas(),
                    u.getFechaRegistro()));
        }
        return Csv.respuesta("usuarios.csv",
                List.of("id", "nombre", "apellido", "tipoDocumento", "numeroDocumento", "correo", "telefono", "rol",
                        "activo", "publicacionesHabilitadas", "fechaRegistro"),
                filas);
    }

    private Usuario buscar(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
    }

    private void validarUnicos(String correo, String documento, Long idExcluido) {
        String c = correo.trim().toLowerCase();
        String d = documento.trim();
        boolean correoUsado = idExcluido == null ? repo.existsByCorreoIgnoreCase(c)
                : repo.existsByCorreoIgnoreCaseAndIdNot(c, idExcluido);
        if (correoUsado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo.");
        }
        boolean documentoUsado = idExcluido == null ? repo.existsByNumeroDocumento(d)
                : repo.existsByNumeroDocumentoAndIdNot(d, idExcluido);
        if (documentoUsado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese número de documento.");
        }
    }

    public static UsuarioDTO aDTO(Usuario u) {
        return UsuarioDTO.builder()
                .id(u.getId()).nombre(u.getNombre()).apellido(u.getApellido())
                .tipoDocumento(u.getTipoDocumento()).numeroDocumento(u.getNumeroDocumento())
                .correo(u.getCorreo()).telefono(u.getTelefono()).rol(u.getRol())
                .activo(u.isActivo()).publicacionesHabilitadas(u.isPublicacionesHabilitadas())
                .fechaRegistro(u.getFechaRegistro()).fechaDesactivacion(u.getFechaDesactivacion())
                .build();
    }
}
