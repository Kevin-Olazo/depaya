package com.depaya.pagos.dto;

import com.depaya.pagos.model.MetodoPago;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// El monto no se envía: sale del total de la reserva.
@Data
public class PagoCrearDTO {

    @NotNull(message = "La reserva es obligatoria.")
    private Long idReserva;

    @NotNull(message = "El método de pago es obligatorio (YAPE, PLIN, VISA o MASTERCARD).")
    private MetodoPago metodo;
}
