package com.depaya.reservas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class ResumenReservasDTO {

    private final long total;
    private final Map<String, Long> porEstado;
    private final long reembolsosPendientes;
    private final BigDecimal valorReservasConfirmadas;
    private final long nochesConfirmadas;
    private final List<ConteoMesDTO> reservasPorMes;
    private final Map<String, Long> topDistritos;
}
