package com.depaya.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class ResumenUsuariosDTO {

    private final long total;
    private final long activos;
    private final long inactivos;
    private final Map<String, Long> porRol;
    private final List<ConteoMesDTO> registrosPorMes;
}
