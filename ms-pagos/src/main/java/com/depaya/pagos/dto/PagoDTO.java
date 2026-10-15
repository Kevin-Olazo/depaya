package com.depaya.pagos.dto;

import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.MetodoPago;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PagoDTO {

    private Long id;
    private Long idReserva;
    private Long idInquilino;
    private String inquilinoNombre;
    private String inquilinoCorreo;
    private Long idPropietario;
    private String departamentoTitulo;
    private String distrito;
    private BigDecimal monto;
    private BigDecimal comision;
    private BigDecimal montoPropietario;
    private String moneda;
    private MetodoPago metodo;
    private EstadoPago estado;
    private String referenciaPasarela;
    private MetodoPago metodoReembolso;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaPago;
    private LocalDateTime fechaSolicitudReembolso;
    private LocalDateTime fechaLimiteReembolso;
    private LocalDateTime fechaReembolso;
}
