package com.depaya.pagos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

// Dashboard del ADMIN. Los ingresos cuentan solo pagos COMPLETADO.
@Getter
@AllArgsConstructor
public class ResumenPagosDTO {

    private final long totalPagos;
    private final Map<String, Long> porEstado;
    private final BigDecimal ingresosBrutos;
    private final BigDecimal comisionDepaya;
    private final BigDecimal montoPropietarios;
    private final long reembolsosPendientes;
    private final BigDecimal montoReembolsosPendientes;
    private final Map<String, BigDecimal> ingresosPorMetodo;
    private final Map<String, BigDecimal> ingresosPorMes;
    private final BigDecimal porcentajeComision;
}
