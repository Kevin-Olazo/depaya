package com.depaya.departamentos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@AllArgsConstructor
public class PaginaDTO<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;

    public static <T> PaginaDTO<T> de(Page<T> p) {
        return new PaginaDTO<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }
}
