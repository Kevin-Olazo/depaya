package com.depaya.pagos.dto;

import com.depaya.pagos.model.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Corrección del ADMIN: método y referencia de la pasarela.
@Data
public class PagoActualizarDTO {

    @NotNull(message = "El método de pago es obligatorio.")
    private MetodoPago metodo;

    @Size(max = 100)
    private String referenciaPasarela;
}
