package com.depaya.departamentos.dto;

import com.depaya.departamentos.model.EstadoDepartamento;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class DepartamentoDTO {

    private Long id;
    private Long idPropietario;
    private String propietarioNombre;
    private String titulo;
    private String descripcion;
    private String distrito;
    private String direccion;
    private String categoria;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private BigDecimal precioNoche;
    private Integer capacidadPersonas;
    private Integer habitaciones;
    private Integer banos;
    private String imagenUrl;
    private boolean tienePiscina;
    private boolean tieneWifi;
    private boolean admiteMascotas;
    private EstadoDepartamento estado;
    private LocalDateTime fechaPublicacion;
}
