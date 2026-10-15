package com.depaya.pagos.controller;

import com.depaya.pagos.config.UsuarioActual;
import com.depaya.pagos.dto.CancelacionReservaDTO;
import com.depaya.pagos.dto.FiltroPago;
import com.depaya.pagos.dto.PagoActualizarDTO;
import com.depaya.pagos.dto.PagoCrearDTO;
import com.depaya.pagos.dto.PagoDTO;
import com.depaya.pagos.dto.PaginaDTO;
import com.depaya.pagos.dto.ResumenIngresosDTO;
import com.depaya.pagos.dto.ResumenPagosDTO;
import com.depaya.pagos.service.PagoService;
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
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService service;

    // ------------------------------------------- inquilino / propietario

    // INQUILINO o PROPIETARIO. Sus pagos como huésped.
    @GetMapping("/mis-pagos")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO')")
    public PaginaDTO<PagoDTO> misPagos(FiltroPago filtro, @AuthenticationPrincipal Jwt jwt) {
        return service.misPagos(filtro, UsuarioActual.de(jwt));
    }

    // PROPIETARIO. Pagos de sus departamentos (ingresos).
    @GetMapping("/mis-ingresos")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public PaginaDTO<PagoDTO> misIngresos(FiltroPago filtro, @AuthenticationPrincipal Jwt jwt) {
        return service.misIngresos(filtro, UsuarioActual.de(jwt));
    }

    // PROPIETARIO. Ingreso bruto, comisión y neto.
    @GetMapping("/mis-ingresos/resumen")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public ResumenIngresosDTO resumenIngresos(@AuthenticationPrincipal Jwt jwt) {
        return service.resumenIngresos(UsuarioActual.de(jwt));
    }

    // Paso 1: crea el pago PROCESANDO de una reserva PENDIENTE propia.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO')")
    public PagoDTO crear(@Valid @RequestBody PagoCrearDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return service.crear(dto, UsuarioActual.de(jwt));
    }

    // Paso 2: confirma el pago (simulado). La reserva pasa a CONFIRMADA.
    @PutMapping("/{id}/confirmar")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO','ADMIN')")
    public PagoDTO confirmar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.confirmar(id, UsuarioActual.de(jwt));
    }

    // Cancela un pago PROCESANDO.
    @PutMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('INQUILINO','PROPIETARIO','ADMIN')")
    public PagoDTO cancelar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.cancelar(id, UsuarioActual.de(jwt));
    }

    // --------------------------------------------------------------- admin

    // ADMIN. Listado de todos los pagos con filtros y ordenamiento.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaginaDTO<PagoDTO> administrar(FiltroPago filtro) {
        return service.administrar(filtro);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResumenPagosDTO resumen() {
        return service.resumen();
    }

    @GetMapping("/exportar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportar(FiltroPago filtro) {
        return service.exportar(filtro);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PagoDTO actualizar(@PathVariable Long id, @Valid @RequestBody PagoActualizarDTO dto) {
        return service.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    // ADMIN. Confirma que el reembolso ya se devolvió.
    @PutMapping("/{id}/reembolso/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public PagoDTO confirmarReembolso(@PathVariable Long id) {
        return service.confirmarReembolso(id);
    }

    // ADMIN. Rechaza el reembolso: el pago vuelve a COMPLETADO.
    @PutMapping("/{id}/reembolso/rechazar")
    @PreAuthorize("hasRole('ADMIN')")
    public PagoDTO rechazarReembolso(@PathVariable Long id) {
        return service.rechazarReembolso(id);
    }

    // ---------------------------------------------------------- uso interno

    @GetMapping("/{id}")
    public PagoDTO obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.obtener(id, UsuarioActual.de(jwt));
    }

    // ms-reservas avisa que la reserva se canceló.
    @PutMapping("/reserva/{idReserva}/cancelacion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SISTEMA')")
    public void reservaCancelada(@PathVariable Long idReserva, @RequestBody CancelacionReservaDTO dto) {
        service.reservaCancelada(idReserva, dto);
    }
}
