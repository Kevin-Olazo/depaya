package com.depaya.reservas.repository;

import com.depaya.reservas.model.EstadoReserva;
import com.depaya.reservas.model.Reserva;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long>, JpaSpecificationExecutor<Reserva> {

    // Hay otra reserva activa en [ingreso, salida)? excluirId = -1 para no excluir ninguna.
    @Query("""
            select count(r) > 0 from Reserva r
            where r.idDepartamento = :idDepartamento
              and r.estado in :estados
              and r.fechaIngreso < :salida
              and r.fechaSalida > :ingreso
              and r.id <> :excluirId
            """)
    boolean existeChoque(@Param("idDepartamento") Long idDepartamento,
                         @Param("estados") Collection<EstadoReserva> estados,
                         @Param("ingreso") LocalDate ingreso,
                         @Param("salida") LocalDate salida,
                         @Param("excluirId") Long excluirId);

    // Ids de departamentos ocupados en el rango. idDepartamento = 0 es todos.
    @Query("""
            select distinct r.idDepartamento from Reserva r
            where r.estado in :estados
              and r.fechaIngreso < :hasta
              and r.fechaSalida > :desde
              and (:idDepartamento = 0 or r.idDepartamento = :idDepartamento)
            """)
    List<Long> idsOcupados(@Param("estados") Collection<EstadoReserva> estados,
                           @Param("desde") LocalDate desde,
                           @Param("hasta") LocalDate hasta,
                           @Param("idDepartamento") Long idDepartamento);

    // Reservas activas de un departamento desde hoy.
    @Query("""
            select r from Reserva r
            where r.idDepartamento = :idDepartamento
              and r.estado in :estados
              and r.fechaSalida >= :hoy
            order by r.fechaIngreso
            """)
    List<Reserva> ocupadas(@Param("idDepartamento") Long idDepartamento,
                           @Param("estados") Collection<EstadoReserva> estados,
                           @Param("hoy") LocalDate hoy);

    // ---------------------------------------------------------- estadisticas

    @Query("select r.estado, count(r) from Reserva r group by r.estado")
    List<Object[]> contarPorEstado();

    @Query("select r.estado, count(r) from Reserva r where r.idPropietario = :idPropietario group by r.estado")
    List<Object[]> contarPorEstadoDelPropietario(@Param("idPropietario") Long idPropietario);

    @Query("select count(r) from Reserva r where r.estadoReembolso = com.depaya.reservas.model.EstadoReembolso.PENDIENTE")
    long contarReembolsosPendientes();

    // null si no hay reservas.
    @Query("select sum(r.total) from Reserva r where r.estado = :estado")
    BigDecimal sumarTotal(@Param("estado") EstadoReserva estado);

    // null si no hay reservas.
    @Query("select sum(r.noches) from Reserva r where r.estado = :estado")
    Long sumarNoches(@Param("estado") EstadoReserva estado);

    // null si no hay reservas próximas.
    @Query("""
            select sum(r.cantidadHuespedes) from Reserva r
            where r.idPropietario = :idPropietario and r.estado in :estados and r.fechaSalida >= :hoy
            """)
    Long sumarHuespedesProximos(@Param("idPropietario") Long idPropietario,
                                @Param("estados") Collection<EstadoReserva> estados,
                                @Param("hoy") LocalDate hoy);

    @Query("""
            select year(r.fechaCreacion), month(r.fechaCreacion), count(r) from Reserva r
            group by year(r.fechaCreacion), month(r.fechaCreacion)
            order by year(r.fechaCreacion), month(r.fechaCreacion)
            """)
    List<Object[]> contarPorMes();

    @Query("""
            select r.distrito, count(r) from Reserva r
            where r.estado <> com.depaya.reservas.model.EstadoReserva.CANCELADA
            group by r.distrito
            order by count(r) desc, r.distrito
            """)
    List<Object[]> topDistritos(Pageable limite);
}
