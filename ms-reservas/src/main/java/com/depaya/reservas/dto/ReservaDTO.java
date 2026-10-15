package com.depaya.reservas.dto;

import com.depaya.reservas.model.EstadoReembolso;
import com.depaya.reservas.model.EstadoReserva;
import com.depaya.reservas.model.MetodoPago;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservaDTO {

    private Long id;
    private Long idDepartamento;
    private Long idInquilino;
    private Long idPropietario;
    private String departamentoTitulo;
    private String distrito;
    private String categoria;
    private String imagenUrl;
    private String inquilinoNombre;
    private String inquilinoCorreo;
    private String propietarioNombre;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private Integer noches;
    private Integer cantidadHuespedes;
    private BigDecimal precioNoche;
    private BigDecimal total;
    private EstadoReserva estado;
    private EstadoReembolso estadoReembolso;
    private MetodoPago metodoReembolso;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaCancelacion;
    private LocalDateTime fechaSolicitudReembolso;
    private LocalDateTime fechaLimiteReembolso;
    private LocalDateTime fechaReembolso;
}
