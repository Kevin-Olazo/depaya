package com.depaya.pagos.repository;

import com.depaya.pagos.dto.TotalesDTO;
import com.depaya.pagos.model.EstadoPago;
import com.depaya.pagos.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long>, JpaSpecificationExecutor<Pago> {

    boolean existsByIdReservaAndEstadoIn(Long idReserva, Collection<EstadoPago> estados);

    Optional<Pago> findFirstByIdReservaAndEstadoInOrderByIdDesc(Long idReserva, Collection<EstadoPago> estados);

    List<Pago> findByEstadoAndFechaLimiteReembolsoLessThanEqual(EstadoPago estado, LocalDateTime limite);

    // ---------------------------------------------------------- estadisticas

    // Sumas de los pagos en un estado. idPropietario = 0 es todos.
    @Query("""
            select new com.depaya.pagos.dto.TotalesDTO(sum(p.monto), sum(p.comision), sum(p.montoPropietario), count(p))
            from Pago p
            where p.estado = :estado and (:idPropietario = 0 or p.idPropietario = :idPropietario)
            """)
    TotalesDTO totales(@Param("estado") EstadoPago estado, @Param("idPropietario") Long idPropietario);

    @Query("select p.estado, count(p) from Pago p group by p.estado")
    List<Object[]> contarPorEstado();

    @Query("""
            select p.metodo, sum(p.monto) from Pago p
            where p.estado = com.depaya.pagos.model.EstadoPago.COMPLETADO
            group by p.metodo
            order by sum(p.monto) desc
            """)
    List<Object[]> ingresosPorMetodo();

    @Query("""
            select year(p.fechaPago), month(p.fechaPago), sum(p.monto) from Pago p
            where p.estado = com.depaya.pagos.model.EstadoPago.COMPLETADO and p.fechaPago is not null
            group by year(p.fechaPago), month(p.fechaPago)
            order by year(p.fechaPago), month(p.fechaPago)
            """)
    List<Object[]> ingresosPorMes();
}
