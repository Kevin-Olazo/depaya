package com.depaya.departamentos.repository;

import com.depaya.departamentos.dto.FiltroDepartamento;
import com.depaya.departamentos.model.Departamento;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class DepartamentoSpecs {

    private DepartamentoSpecs() {
    }

    // excluirIds: departamentos ocupados en las fechas pedidas.
    public static Specification<Departamento> filtrar(FiltroDepartamento f, Collection<Long> excluirIds) {
        return (root, query, cb) -> {
            List<Predicate> c = new ArrayList<>();
            if (f.getQ() != null && !f.getQ().isBlank()) {
                String like = "%" + f.getQ().trim().toLowerCase() + "%";
                c.add(cb.or(
                        cb.like(cb.lower(root.get("titulo")), like),
                        cb.like(cb.lower(root.get("descripcion")), like),
                        cb.like(cb.lower(root.get("distrito")), like),
                        cb.like(cb.lower(root.get("direccion")), like),
                        cb.like(cb.lower(root.get("propietarioNombre")), like)));
            }
            if (f.getDistrito() != null && !f.getDistrito().isBlank()) {
                c.add(cb.equal(cb.lower(root.get("distrito")), f.getDistrito().trim().toLowerCase()));
            }
            if (f.getCategoria() != null && !f.getCategoria().isBlank()) {
                c.add(cb.equal(cb.lower(root.get("categoria")), f.getCategoria().trim().toLowerCase()));
            }
            if (f.getPrecioMin() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("precioNoche"), f.getPrecioMin()));
            }
            if (f.getPrecioMax() != null) {
                c.add(cb.lessThanOrEqualTo(root.get("precioNoche"), f.getPrecioMax()));
            }
            if (f.getHuespedes() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("capacidadPersonas"), f.getHuespedes()));
            }
            if (f.getHabitaciones() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("habitaciones"), f.getHabitaciones()));
            }
            if (f.getBanos() != null) {
                c.add(cb.greaterThanOrEqualTo(root.get("banos"), f.getBanos()));
            }
            if (Boolean.TRUE.equals(f.getPiscina())) {
                c.add(cb.isTrue(root.get("tienePiscina")));
            }
            if (Boolean.TRUE.equals(f.getWifi())) {
                c.add(cb.isTrue(root.get("tieneWifi")));
            }
            if (Boolean.TRUE.equals(f.getMascotas())) {
                c.add(cb.isTrue(root.get("admiteMascotas")));
            }
            if (f.getEstado() != null) {
                c.add(cb.equal(root.get("estado"), f.getEstado()));
            }
            if (f.getPropietarioId() != null) {
                c.add(cb.equal(root.get("idPropietario"), f.getPropietarioId()));
            }
            if (excluirIds != null && !excluirIds.isEmpty()) {
                c.add(cb.not(root.get("id").in(excluirIds)));
            }
            return cb.and(c.toArray(new Predicate[0]));
        };
    }
}
