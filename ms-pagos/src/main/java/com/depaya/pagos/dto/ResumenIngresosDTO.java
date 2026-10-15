package com.depaya.pagos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

// Ingresos del propietario: bruto, comisión y neto.
@Getter
@AllArgsConstructor
public class ResumenIngresosDTO {

    private final long pagosCompletados;
    private final BigDecimal ingresoBruto;
    private final BigDecimal comisionDepaya;
    private final BigDecimal ingresoNeto;
    private final long reembolsosPendientes;
    private final BigDecimal porcentajeComision;
}
