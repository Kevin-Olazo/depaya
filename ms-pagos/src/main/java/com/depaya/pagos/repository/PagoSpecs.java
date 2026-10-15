package com.depaya.pagos.repository;

import com.depaya.pagos.dto.FiltroPago;
import com.depaya.pagos.model.Pago;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PagoSpecs {

    private PagoSpecs() {
    }

    public static Specification<Pago> filtrar(FiltroPago f) {
        return (root, query, cb) -> {
            List<Predicate> c = new ArrayList<>();
            if (f.getQ() != null && !f.getQ().isBlank()) {
                String like = "%" + f.getQ().trim().toLowerCase() + "%";
                c.add(cb.or(
                        cb.like(cb.lower(root.get("departamentoTitulo")), like),
                        cb.like(cb.lower(root.get("distrito")), like),
                        cb.like(cb.lower(root.get("inquilinoNombre")), like),
                        cb.like(cb.lower(root.get("inquilinoCorreo")), like),
                        cb.like(cb.lower(root.get("referenciaPasarela")), like)));
            }
            if (f.getEstado() != null) {
                c.add(cb.equal(root.get("estado"), f.getEstado()));
            }
            if (f.getMetodo() != null) {
                c.add(cb.equal(root.get("metodo"), f.getMetodo()));
            }
            if (f.getIdReserva() != null) {
                c.add(cb.equal(root.get("idReserva"), f.getIdReserva()));
            }
            if (f.getIdInquilino() != null) {
                c.add(cb.equal(root.get("idInquilino"), f.getIdInquilino()));
            }
            if (f.getIdPropietario() != null) {
                c.add(cb.equal(root.get("idPropietario"), f.getIdPropietario()));
            }
            if (f.getDesde() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), f.getDesde().atStartOfDay()));
            }
            if (f.getHasta() != null) {
                c.add(cb.lessThan(root.get("fechaCreacion"), f.getHasta().plusDays(1).atStartOfDay()));
            }
            return cb.and(c.toArray(new Predicate[0]));
        };
    }
}
