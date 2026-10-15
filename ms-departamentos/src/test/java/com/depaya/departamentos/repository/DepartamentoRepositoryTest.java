package com.depaya.departamentos.repository;

import com.depaya.departamentos.dto.FiltroDepartamento;
import com.depaya.departamentos.model.Departamento;
import com.depaya.departamentos.model.EstadoDepartamento;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Pruebas de la capa de datos: insertar, actualizar, eliminar y listar.
@DataJpaTest
class DepartamentoRepositoryTest {

    @Autowired
    private DepartamentoRepository repo;

    private Departamento depa(Long idPropietario, String titulo, String distrito, String precio, int capacidad) {
        Departamento d = new Departamento();
        d.setIdPropietario(idPropietario);
        d.setPropietarioNombre("Propietario " + idPropietario);
        d.setTitulo(titulo);
        d.setDescripcion("Descripción de " + titulo);
        d.setDistrito(distrito);
        d.setDireccion("Av. Prueba 123");
        d.setCategoria("Moderno");
        d.setPrecioNoche(new BigDecimal(precio));
        d.setCapacidadPersonas(capacidad);
        d.setHabitaciones(1);
        d.setBanos(1);
        d.setImagenUrl("https://ejemplo.com/foto.jpg");
        return d;
    }

    @Test
    void insertar() {
        Departamento guardado = repo.saveAndFlush(depa(1L, "Depa uno", "Miraflores", "200.00", 2));

        assertNotNull(guardado.getId());
        assertNotNull(guardado.getFechaPublicacion());
        assertEquals(EstadoDepartamento.DISPONIBLE, guardado.getEstado());
    }

    @Test
    void actualizar() {
        Departamento guardado = repo.saveAndFlush(depa(1L, "Depa dos", "Barranco", "150.00", 2));

        guardado.setPrecioNoche(new BigDecimal("175.50"));
        guardado.setEstado(EstadoDepartamento.MANTENIMIENTO);
        repo.saveAndFlush(guardado);

        Departamento leido = repo.findById(guardado.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("175.50").compareTo(leido.getPrecioNoche()));
        assertEquals(EstadoDepartamento.MANTENIMIENTO, leido.getEstado());
    }

    @Test
    void eliminar() {
        Departamento guardado = repo.saveAndFlush(depa(2L, "Depa tres", "Lince", "120.00", 2));

        repo.deleteById(guardado.getId());
        repo.flush();

        assertFalse(repo.existsById(guardado.getId()));
    }

    @Test
    void listarYFiltrar() {
        repo.save(depa(1L, "Depa A", "Miraflores", "300.00", 2));
        repo.save(depa(1L, "Depa B", "Miraflores", "100.00", 6));
        repo.saveAndFlush(depa(2L, "Depa C", "Barranco", "200.00", 4));

        assertEquals(3, repo.findAll().size());

        FiltroDepartamento filtro = new FiltroDepartamento();
        filtro.setDistrito("miraflores");
        assertEquals(2, repo.findAll(DepartamentoSpecs.filtrar(filtro, List.of())).size());

        filtro.setPrecioMax(new BigDecimal("150"));
        assertEquals(1, repo.findAll(DepartamentoSpecs.filtrar(filtro, List.of())).size());

        FiltroDepartamento porHuespedes = new FiltroDepartamento();
        porHuespedes.setHuespedes(5);
        assertEquals(1, repo.findAll(DepartamentoSpecs.filtrar(porHuespedes, List.of())).size());

        FiltroDepartamento porTexto = new FiltroDepartamento();
        porTexto.setQ("depa c");
        List<Departamento> encontrados = repo.findAll(DepartamentoSpecs.filtrar(porTexto, List.of()));
        assertEquals(1, encontrados.size());
        assertEquals("Depa C", encontrados.get(0).getTitulo());
    }

    @Test
    void excluirIdsOcupados() {
        Departamento a = repo.save(depa(1L, "Depa A", "Miraflores", "300.00", 2));
        repo.saveAndFlush(depa(1L, "Depa B", "Miraflores", "100.00", 2));

        List<Departamento> libres = repo.findAll(DepartamentoSpecs.filtrar(new FiltroDepartamento(), List.of(a.getId())));

        assertEquals(1, libres.size());
        assertTrue(libres.stream().noneMatch(d -> d.getId().equals(a.getId())));
    }

    @Test
    void desactivarYReactivarPorPropietario() {
        repo.save(depa(1L, "Depa A", "Miraflores", "300.00", 2));
        repo.save(depa(1L, "Depa B", "Lince", "100.00", 2));
        repo.saveAndFlush(depa(2L, "Depa C", "Barranco", "200.00", 2));

        assertEquals(2, repo.cambiarEstadoDelPropietario(1L, EstadoDepartamento.INACTIVO));
        assertEquals(0, repo.distritosConEstado(EstadoDepartamento.DISPONIBLE).stream()
                .filter(x -> x.equals("Miraflores") || x.equals("Lince")).count());

        assertEquals(2, repo.reactivarDelPropietario(1L, EstadoDepartamento.INACTIVO, EstadoDepartamento.DISPONIBLE));
        assertEquals(3, repo.distritosConEstado(EstadoDepartamento.DISPONIBLE).size());
    }
}
