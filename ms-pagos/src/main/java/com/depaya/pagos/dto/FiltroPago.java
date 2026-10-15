package com.depaya.pagos.dto;

import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.MetodoPago;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

// Filtros del listado. idInquilino e idPropietario solo se usan en el listado del ADMIN.
@Getter
@Setter
public class FiltroPago extends ParametrosPagina {

    private String q;
    private EstadoPago estado;
    private MetodoPago metodo;
    private Long idReserva;
    private Long idInquilino;
    private Long idPropietario;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate desde;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate hasta;
}
