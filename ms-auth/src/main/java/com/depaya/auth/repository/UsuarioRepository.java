package com.depaya.auth.repository;

import com.depaya.auth.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long>, JpaSpecificationExecutor<Usuario> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByNumeroDocumento(String numeroDocumento);

    boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);

    boolean existsByNumeroDocumentoAndIdNot(String numeroDocumento, Long id);

    long countByActivo(boolean activo);

    @Query("select u.rol, count(u) from Usuario u group by u.rol")
    List<Object[]> contarPorRol();

    @Query("""
            select year(u.fechaRegistro), month(u.fechaRegistro), count(u)
            from Usuario u
            group by year(u.fechaRegistro), month(u.fechaRegistro)
            order by year(u.fechaRegistro), month(u.fechaRegistro)
            """)
    List<Object[]> contarPorMes();
}
