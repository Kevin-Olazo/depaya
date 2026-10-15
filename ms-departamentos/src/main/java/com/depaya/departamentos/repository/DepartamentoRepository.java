package com.depaya.departamentos.repository;

import com.depaya.departamentos.model.Departamento;
import com.depaya.departamentos.model.EstadoDepartamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DepartamentoRepository extends JpaRepository<Departamento, Long>, JpaSpecificationExecutor<Departamento> {

    @Query("select distinct d.distrito from Departamento d where d.estado = :estado order by d.distrito")
    List<String> distritosConEstado(@Param("estado") EstadoDepartamento estado);

    // Cambia el estado de todos los departamentos del propietario.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Departamento d set d.estado = :nuevo where d.idPropietario = :idPropietario and d.estado <> :nuevo")
    int cambiarEstadoDelPropietario(@Param("idPropietario") Long idPropietario,
                                    @Param("nuevo") EstadoDepartamento nuevo);

    // Reactiva solo los INACTIVOS.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Departamento d set d.estado = :nuevo where d.idPropietario = :idPropietario and d.estado = :actual")
    int reactivarDelPropietario(@Param("idPropietario") Long idPropietario,
                                @Param("actual") EstadoDepartamento actual,
                                @Param("nuevo") EstadoDepartamento nuevo);

    @Query("select d.estado, count(d) from Departamento d group by d.estado")
    List<Object[]> contarPorEstado();

    @Query("select d.distrito, count(d) from Departamento d group by d.distrito order by count(d) desc, d.distrito")
    List<Object[]> contarPorDistrito();

    @Query("select d.categoria, count(d) from Departamento d group by d.categoria order by count(d) desc, d.categoria")
    List<Object[]> contarPorCategoria();

    @Query("select avg(d.precioNoche) from Departamento d")
    Double precioPromedio();

    @Query("select count(distinct d.idPropietario) from Departamento d")
    long contarPropietarios();
}
