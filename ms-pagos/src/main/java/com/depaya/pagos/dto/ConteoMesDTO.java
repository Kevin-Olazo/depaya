package com.depaya.pagos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// Conteo por mes (formato "2026-10").
@Getter
@AllArgsConstructor
public class ConteoMesDTO {

    private final String mes;
    private final long total;
}
