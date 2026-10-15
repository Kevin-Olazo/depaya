package com.depaya.pagos.dto;

import java.math.BigDecimal;

// Sumas de la consulta. Los nulos pasan a 0.
public class TotalesDTO {

    private final BigDecimal monto;
    private final BigDecimal comision;
    private final BigDecimal montoPropietario;
    private final long cantidad;

    public TotalesDTO(BigDecimal monto, BigDecimal comision, BigDecimal montoPropietario, Long cantidad) {
        this.monto = monto == null ? BigDecimal.ZERO : monto;
        this.comision = comision == null ? BigDecimal.ZERO : comision;
        this.montoPropietario = montoPropietario == null ? BigDecimal.ZERO : montoPropietario;
        this.cantidad = cantidad == null ? 0 : cantidad;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public BigDecimal getComision() {
        return comision;
    }

    public BigDecimal getMontoPropietario() {
        return montoPropietario;
    }

    public long getCantidad() {
        return cantidad;
    }
}
