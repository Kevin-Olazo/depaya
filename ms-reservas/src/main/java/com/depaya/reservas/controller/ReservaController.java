package com.depaya.reservas.controller;

import com.depaya.reservas.config.UsuarioActual;
import com.depaya.reservas.dto.CancelarReservaDTO;
import com.depaya.reservas.dto.FiltroReserva;
import com.depaya.reservas.dto.OcupadaDTO;
import com.depaya.reservas.dto.PaginaDTO;
import com.depaya.reservas.dto.ReembolsoInternoDTO;
import com.depaya.reservas.dto.ReservaActualizarDTO;
import com.depaya.reservas.dto.ReservaCrearDTO;
import com.depaya.reservas.dto.ReservaDTO;
import com.depaya.reservas.dto.ResumenAlquileresDTO;
import com.depaya.reservas.dto.ResumenReservasDTO;
import com.depaya.reservas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService service;

    // ------------------------------------------------------------- publico

    // Fechas ocupadas de un departamento (calendario). El día de salida queda libre.
    @GetMapping("/ocupadas")
    public List<OcupadaDTO> ocupadas(@RequestParam Long idDepartamento) {
        return service.ocupadas(idDepartamento);
    }

    // Ids de departamentos ocupados en [desde, hasta). Lo usa ms-departamentos.
    @GetMapping("/ocupados")
    public List<Long> ocupados(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                               @RequestParam(required = false) Long idDepartamento) {
        return service.idsOcupados(desde, hasta, idDepartamento);
    }

    // ------------------------------------------- inquilino / propietario

    // INQUILINO o PROPIETARIO. Sus reservas como huésped.
    @GetMapping("/mis-reservas")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO')")
    public PaginaDTO<ReservaDTO> misReservas(FiltroReserva filtro, @AuthenticationPrincipal Jwt jwt) {
        return service.misReservas(filtro, UsuarioActual.de(jwt));
    }

    // PROPIETARIO. Reservas de sus departamentos.
    @GetMapping("/mis-alquileres")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public PaginaDTO<ReservaDTO> misAlquileres(FiltroReserva filtro, @AuthenticationPrincipal Jwt jwt) {
        return service.misAlquileres(filtro, UsuarioActual.de(jwt));
    }

    @GetMapping("/mis-alquileres/resumen")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public ResumenAlquileresDTO resumenAlquileres(@AuthenticationPrincipal Jwt jwt) {
        return service.resumenAlquileres(UsuarioActual.de(jwt));
    }

    // INQUILINO o PROPIETARIO. No puede reservar su propio departamento.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO')")
    public ReservaDTO crear(@Valid @RequestBody ReservaCrearDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return service.crear(dto, UsuarioActual.de(jwt));
    }

    // Solo si la reserva está PENDIENTE.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO','ADMIN')")
    public ReservaDTO actualizar(@PathVariable Long id, @Valid @RequestBody ReservaActualizarDTO dto,
                                 @AuthenticationPrincipal Jwt jwt) {
        return service.actualizar(id, dto, UsuarioActual.de(jwt));
    }

    // Cancela la reserva. El cuerpo es opcional: {"metodoReembolso": "YAPE"}.
    @PutMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO','ADMIN')")
    public ReservaDTO cancelar(@PathVariable Long id, @RequestBody(required = false) CancelarReservaDTO dto,
                               @AuthenticationPrincipal Jwt jwt) {
        return service.cancelar(id, dto, UsuarioActual.de(jwt));
    }

    // --------------------------------------------------------------- admin

    // ADMIN. Listado de todas las reservas con filtros y ordenamiento.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaginaDTO<ReservaDTO> administrar(FiltroReserva filtro) {
        return service.administrar(filtro);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResumenReservasDTO resumen() {
        return service.resumen();
    }

    @GetMapping("/exportar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportar(FiltroReserva filtro) {
        return service.exportar(filtro);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    // ---------------------------------------------------------- uso interno

    @GetMapping("/{id}")
    public ReservaDTO obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.obtener(id, UsuarioActual.de(jwt));
    }

    @PutMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('SISTEMA')")
    public ReservaDTO confirmar(@PathVariable Long id) {
        return service.confirmar(id);
    }

    @PutMapping("/{id}/reembolso")
    @PreAuthorize("hasRole('SISTEMA')")
    public ReservaDTO actualizarReembolso(@PathVariable Long id, @Valid @RequestBody ReembolsoInternoDTO dto) {
        return service.actualizarReembolso(id, dto);
    }
}
