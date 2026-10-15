package com.depaya.reservas.dto;

import com.depaya.reservas.model.MetodoPago;
import lombok.Data;

// Cuerpo opcional al cancelar: método para recibir el reembolso.
@Data
public class CancelarReservaDTO {

    private MetodoPago metodoReembolso;
}
