package com.depaya.departamentos.dto;

import com.depaya.departamentos.model.EstadoDepartamento;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

// Filtros del catálogo. estado y propietarioId solo se usan en los listados de PROPIETARIO y ADMIN.
@Getter
@Setter
public class FiltroDepartamento extends ParametrosPagina {

    private String q;
    private String distrito;
    private String categoria;
    private BigDecimal precioMin;
    private BigDecimal precioMax;
    private Integer huespedes;
    private Integer habitaciones;
    private Integer banos;
    private Boolean piscina;
    private Boolean wifi;
    private Boolean mascotas;
    private EstadoDepartamento estado;
    private Long propietarioId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate desde;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate hasta;
}
