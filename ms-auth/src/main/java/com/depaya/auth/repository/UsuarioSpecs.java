package com.depaya.auth.repository;

import com.depaya.auth.dto.FiltroUsuario;
import com.depaya.auth.model.Usuario;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class UsuarioSpecs {

    private UsuarioSpecs() {
    }

    public static Specification<Usuario> filtrar(FiltroUsuario f) {
        return (root, query, cb) -> {
            List<Predicate> condiciones = new ArrayList<>();
            if (f.getQ() != null && !f.getQ().isBlank()) {
                String like = "%" + f.getQ().trim().toLowerCase() + "%";
                condiciones.add(cb.or(
                        cb.like(cb.lower(root.get("nombre")), like),
                        cb.like(cb.lower(root.get("apellido")), like),
                        cb.like(cb.lower(root.get("correo")), like),
                        cb.like(cb.lower(root.get("numeroDocumento")), like)));
            }
            if (f.getRol() != null) {
                condiciones.add(cb.equal(root.get("rol"), f.getRol()));
            }
            if (f.getActivo() != null) {
                condiciones.add(cb.equal(root.get("activo"), f.getActivo()));
            }
            return cb.and(condiciones.toArray(new Predicate[0]));
        };
    }
}
