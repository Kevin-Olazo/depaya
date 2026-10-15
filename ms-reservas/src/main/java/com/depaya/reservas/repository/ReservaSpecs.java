package com.depaya.reservas.repository;

import com.depaya.reservas.dto.FiltroReserva;
import com.depaya.reservas.model.Reserva;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ReservaSpecs {

    private ReservaSpecs() {
    }

    public static Specification<Reserva> filtrar(FiltroReserva f) {
        return (root, query, cb) -> {
            List<Predicate> c = new ArrayList<>();
            if (f.getQ() != null && !f.getQ().isBlank()) {
                String like = "%" + f.getQ().trim().toLowerCase() + "%";
                c.add(cb.or(
                        cb.like(cb.lower(root.get("departamentoTitulo")), like),
                        cb.like(cb.lower(root.get("distrito")), like),
                        cb.like(cb.lower(root.get("inquilinoNombre")), like),
                        cb.like(cb.lower(root.get("inquilinoCorreo")), like),
                        cb.like(cb.lower(root.get("propietarioNombre")), like)));
            }
            if (f.getEstado() != null) {
                c.add(cb.equal(root.get("estado"), f.getEstado()));
            }
            if (f.getEstadoReembolso() != null) {
                c.add(cb.equal(root.get("estadoReembolso"), f.getEstadoReembolso()));
            }
            if (f.getIdDepartamento() != null) {
                c.add(cb.equal(root.get("idDepartamento"), f.getIdDepartamento()));
            }
            if (f.getIdInquilino() != null) {
                c.add(cb.equal(root.get("idInquilino"), f.getIdInquilino()));
            }
            if (f.getIdPropietario() != null) {
                c.add(cb.equal(root.get("idPropietario"), f.getIdPropietario()));
            }
            if (f.getDistrito() != null && !f.getDistrito().isBlank()) {
                c.add(cb.equal(cb.lower(root.get("distrito")), f.getDistrito().trim().toLowerCase()));
            }
            if (f.getDesde() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("fechaIngreso"), f.getDesde()));
            }
            if (f.getHasta() != null) {
                c.add(cb.lessThanOrEqualTo(root.get("fechaIngreso"), f.getHasta()));
            }
            return cb.and(c.toArray(new Predicate[0]));
        };
    }
}
