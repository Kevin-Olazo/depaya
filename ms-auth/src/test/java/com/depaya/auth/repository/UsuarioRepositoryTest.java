package com.depaya.auth.repository;

import com.depaya.auth.dto.FiltroUsuario;
import com.depaya.auth.model.Rol;
import com.depaya.auth.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Pruebas de la capa de datos: insertar, actualizar, eliminar y listar.
@DataJpaTest
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository repo;

    private Usuario usuario(String correo, String documento, Rol rol) {
        Usuario u = new Usuario();
        u.setNombre("Prueba");
        u.setApellido("Usuario");
        u.setTipoDocumento("DNI");
        u.setNumeroDocumento(documento);
        u.setCorreo(correo);
        u.setTelefono("999888777");
        u.setPassword("hash");
        u.setRol(rol);
        return u;
    }

    @Test
    void insertar() {
        Usuario guardado = repo.saveAndFlush(usuario("a@test.com", "11111111", Rol.INQUILINO));

        assertNotNull(guardado.getId());
        assertNotNull(guardado.getFechaRegistro());
        assertTrue(guardado.isActivo());
        assertTrue(repo.findByCorreoIgnoreCase("A@TEST.COM").isPresent());
    }

    @Test
    void actualizar() {
        Usuario guardado = repo.saveAndFlush(usuario("b@test.com", "22222222", Rol.INQUILINO));

        guardado.setTelefono("911111111");
        guardado.setActivo(false);
        repo.saveAndFlush(guardado);

        Usuario leido = repo.findById(guardado.getId()).orElseThrow();
        assertEquals("911111111", leido.getTelefono());
        assertFalse(leido.isActivo());
    }

    @Test
    void eliminar() {
        Usuario guardado = repo.saveAndFlush(usuario("c@test.com", "33333333", Rol.PROPIETARIO));

        repo.deleteById(guardado.getId());
        repo.flush();

        assertFalse(repo.existsById(guardado.getId()));
    }

    @Test
    void listarYFiltrar() {
        repo.save(usuario("d@test.com", "44444444", Rol.INQUILINO));
        repo.save(usuario("e@test.com", "55555555", Rol.INQUILINO));
        repo.saveAndFlush(usuario("f@test.com", "66666666", Rol.PROPIETARIO));

        assertEquals(3, repo.findAll().size());

        FiltroUsuario filtro = new FiltroUsuario();
        filtro.setRol(Rol.INQUILINO);
        assertEquals(2, repo.findAll(UsuarioSpecs.filtrar(filtro)).size());

        filtro.setQ("f@test");
        filtro.setRol(null);
        assertEquals(1, repo.findAll(UsuarioSpecs.filtrar(filtro)).size());
    }

    @Test
    void correoDuplicadoSeRechaza() {
        repo.saveAndFlush(usuario("g@test.com", "77777777", Rol.INQUILINO));

        assertThrows(DataIntegrityViolationException.class,
                () -> repo.saveAndFlush(usuario("g@test.com", "88888888", Rol.INQUILINO)));
    }
}
