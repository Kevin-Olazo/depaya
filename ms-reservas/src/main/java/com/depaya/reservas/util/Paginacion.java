package com.depaya.reservas.util;

import com.depaya.reservas.dto.ParametrosPagina;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

public final class Paginacion {

    private static final int TAMANO_MAXIMO = 100;

    private Paginacion() {
    }

    // Crea un Pageable a partir de los parámetros de página, validando que sean correctos y que el campo de ordenamiento esté permitido.
    public static Pageable crear(ParametrosPagina p, Set<String> camposPermitidos, Sort porDefecto) {
        if (p.getPage() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page no puede ser negativo.");
        }
        if (p.getSize() < 1 || p.getSize() > TAMANO_MAXIMO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size debe estar entre 1 y " + TAMANO_MAXIMO + ".");
        }
        Sort orden = porDefecto;
        if (p.getSort() != null && !p.getSort().isBlank()) {
            String[] partes = p.getSort().split(",");
            String campo = partes[0].trim();
            if (!camposPermitidos.contains(campo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No se puede ordenar por '" + campo + "'. Permitidos: " + camposPermitidos);
            }
            Sort.Direction direccion = partes.length > 1 && partes[1].trim().equalsIgnoreCase("desc")
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            orden = Sort.by(direccion, campo);
            if (!campo.equals("id")) {
                orden = orden.and(Sort.by(Sort.Direction.ASC, "id"));
            }
        }
        return PageRequest.of(p.getPage(), p.getSize(), orden);
    }

    // Crea una página para exportar a CSV.
    public static Pageable paraExportar(Sort orden) {
        return PageRequest.of(0, 10_000, orden);
    }
}
