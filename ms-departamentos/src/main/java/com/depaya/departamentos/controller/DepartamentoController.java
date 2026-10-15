package com.depaya.departamentos.controller;

import com.depaya.departamentos.config.UsuarioActual;
import com.depaya.departamentos.dto.ActivacionDTO;
import com.depaya.departamentos.dto.DepartamentoDTO;
import com.depaya.departamentos.dto.DepartamentoGuardarDTO;
import com.depaya.departamentos.dto.EstadoDepartamentoDTO;
import com.depaya.departamentos.dto.FiltroDepartamento;
import com.depaya.departamentos.dto.PaginaDTO;
import com.depaya.departamentos.dto.ResumenDepartamentosDTO;
import com.depaya.departamentos.service.DepartamentoService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departamentos")
@RequiredArgsConstructor
public class DepartamentoController {

    private final DepartamentoService service;

    // ------------------------------------------------------------- publico

    // Catalogo publico con filtros y ordenamiento. Solo devuelve departamentos activos.
    @GetMapping
    public PaginaDTO<DepartamentoDTO> catalogo(FiltroDepartamento filtro) {
        return service.catalogo(filtro);
    }

    @GetMapping("/{id}")
    public DepartamentoDTO obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @GetMapping("/distritos")
    public List<String> distritos() {
        return service.distritos();
    }

    @GetMapping("/categorias")
    public List<String> categorias() {
        return DepartamentoService.CATEGORIAS;
    }

    // --------------------------------------------------------- propietario

    // PROPIETARIO. Listado de sus departamentos con filtros y ordenamiento.
    @GetMapping("/mis-departamentos")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public PaginaDTO<DepartamentoDTO> misDepartamentos(FiltroDepartamento filtro, @AuthenticationPrincipal Jwt jwt) {
        return service.misDepartamentos(filtro, UsuarioActual.de(jwt));
    }

    // --------------------------------------------------------------- admin

    // ADMIN. Listado de todos los departamentos con filtros y ordenamiento.
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PaginaDTO<DepartamentoDTO> administrar(FiltroDepartamento filtro) {
        return service.administrar(filtro);
    }

    // ADMIN. Totales para el dashboard.
    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResumenDepartamentosDTO resumen() {
        return service.resumen();
    }

    // ADMIN. Exporta a CSV según el filtro y ordenamiento.
    @GetMapping("/exportar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportar(FiltroDepartamento filtro) {
        return service.exportar(filtro);
    }

    // ------------------------------------------------ propietario y admin

    // PROPIETARIO o ADMIN. El PROPIETARIO publica a su nombre; el ADMIN indica idPropietario.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMIN')")
    public DepartamentoDTO crear(@Valid @RequestBody DepartamentoGuardarDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return service.crear(dto, UsuarioActual.de(jwt));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMIN')")
    public DepartamentoDTO actualizar(@PathVariable Long id, @Valid @RequestBody DepartamentoGuardarDTO dto,
                                      @AuthenticationPrincipal Jwt jwt) {
        return service.actualizar(id, dto, UsuarioActual.de(jwt));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMIN')")
    public DepartamentoDTO cambiarEstado(@PathVariable Long id, @Valid @RequestBody EstadoDepartamentoDTO dto,
                                         @AuthenticationPrincipal Jwt jwt) {
        return service.cambiarEstado(id, dto.getEstado(), UsuarioActual.de(jwt));
    }

    // ADMIN o el propio propietario. Activa o desactiva todos sus departamentos.
    @PutMapping("/propietario/{idPropietario}/activacion")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMIN')")
    public Map<String, Integer> activacion(@PathVariable Long idPropietario, @Valid @RequestBody ActivacionDTO dto,
                                           @AuthenticationPrincipal Jwt jwt) {
        int n = service.activarODesactivarDelPropietario(idPropietario, dto.getActivo(), UsuarioActual.de(jwt));
        return Map.of("actualizados", n);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMIN')")
    public void eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.eliminar(id, UsuarioActual.de(jwt));
    }
}
