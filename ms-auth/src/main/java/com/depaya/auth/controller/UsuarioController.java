package com.depaya.auth.controller;

import com.depaya.auth.config.UsuarioActual;
import com.depaya.auth.dto.EstadoUsuarioDTO;
import com.depaya.auth.dto.FiltroUsuario;
import com.depaya.auth.dto.PaginaDTO;
import com.depaya.auth.dto.ResumenUsuariosDTO;
import com.depaya.auth.dto.UsuarioActualizarDTO;
import com.depaya.auth.dto.UsuarioCrearDTO;
import com.depaya.auth.dto.UsuarioDTO;
import com.depaya.auth.dto.UsuarioPublicoDTO;
import com.depaya.auth.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    // Roles: ADMIN, PROPIETARIO, INQUILINO. SISTEMA es solo para llamadas internas entre servicios.

    // ADMIN. Listado paginado con filtros y ordenamiento.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaginaDTO<UsuarioDTO> listar(FiltroUsuario filtro) {
        return service.listar(filtro);
    }

    // ADMIN. Totales para el dashboard.
    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResumenUsuariosDTO resumen() {
        return service.resumen();
    }

    // ADMIN. Exporta a CSV según el filtro y ordenamiento.
    @GetMapping("/exportar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportar(FiltroUsuario filtro) {
        return service.exportar(filtro);
    }

    // ADMIN o el propio usuario. El propio usuario solo puede ver su información, no la de otros.
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    public UsuarioDTO obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    // SISTEMA o ADMIN. Datos básicos de un usuario, para otros servicios.
    @GetMapping("/{id}/publico")
    @PreAuthorize("hasAnyRole('SISTEMA','ADMIN')")
    public UsuarioPublicoDTO publico(@PathVariable Long id) {
        return service.publico(id);
    }

    // ADMIN. Crea un usuario con cualquier rol.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioDTO crear(@Valid @RequestBody UsuarioCrearDTO dto) {
        return service.crear(dto);
    }

    // ADMIN o el propio usuario (el rol solo lo cambia un ADMIN).
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    public UsuarioDTO actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioActualizarDTO dto,
                                 @AuthenticationPrincipal Jwt jwt) {
        return service.actualizar(id, dto, UsuarioActual.de(jwt));
    }

    // ADMIN. Activa/desactiva la cuenta y habilita/bloquea publicaciones.
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioDTO cambiarEstado(@PathVariable Long id, @RequestBody EstadoUsuarioDTO dto,
                                    @AuthenticationPrincipal Jwt jwt) {
        return service.cambiarEstado(id, dto, UsuarioActual.de(jwt));
    }

    // El propio usuario puede desactivar su cuenta, lo que bloquea sus publicaciones y no permite iniciar sesión.
    @PutMapping("/me/desactivar")
    public UsuarioDTO desactivarMiCuenta(@AuthenticationPrincipal Jwt jwt) {
        return service.desactivarMiCuenta(UsuarioActual.de(jwt));
    }

    // ADMIN.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.eliminar(id, UsuarioActual.de(jwt));
    }
}
