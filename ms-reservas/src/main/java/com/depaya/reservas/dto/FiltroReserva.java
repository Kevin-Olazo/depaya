package com.depaya.reservas.dto;

import com.depaya.reservas.model.EstadoReembolso;
import com.depaya.reservas.model.EstadoReserva;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

// Filtros del listado. idInquilino e idPropietario solo se usan en el listado del ADMIN.
@Getter
@Setter
public class FiltroReserva extends ParametrosPagina {

    private String q;
    private EstadoReserva estado;
    private EstadoReembolso estadoReembolso;
    private Long idDepartamento;
    private Long idInquilino;
    private Long idPropietario;
    private String distrito;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate desde;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate hasta;
}
