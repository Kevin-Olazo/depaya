package com.depaya.departamentos.config;

import com.depaya.departamentos.model.Departamento;
import com.depaya.departamentos.repository.DepartamentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatosIniciales implements CommandLineRunner {

    private static final String[] IMAGENES = {
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
    };

    private final DepartamentoRepository repo;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }
        List<Departamento> lista = new ArrayList<>();
        lista.add(depa(1L, "Alonso Vargas", "Moderno Depa frente al Malecón", "Vista al mar, amoblado y con línea blanca.",
                "Miraflores", "Malecón de la Reserva 615", "Vista al mar", "-12.1293", "-77.0321", "280.00", 2, 1, 1, false, true, false));
        lista.add(depa(1L, "Alonso Vargas", "Loft Ejecutivo cerca al centro financiero", "Ideal para negocios, wifi fibra óptica.",
                "San Isidro", "Calle Las Begonias 450", "Ejecutivo", "-12.0975", "-77.0267", "220.00", 2, 1, 1, false, true, false));
        lista.add(depa(2L, "Mariana Silva", "Acogedor depa en zona residencial", "Tranquilidad total, cerca de parques.",
                "Santiago de Surco", "Av. Primavera 1200", "Familiar", "-12.1152", "-76.9841", "160.00", 4, 2, 2, false, true, false));
        lista.add(depa(2L, "Mariana Silva", "Estudio bohemio cultural", "A pasos del Puente de los Suspiros.",
                "Barranco", "Jr. 28 de Julio 206", "Moderno", "-12.1458", "-77.0205", "190.00", 2, 1, 1, false, true, false));
        lista.add(depa(3L, "Roberto Mendoza", "Amplio departamento familiar", "Seguridad 24/7 y áreas comunes con piscina.",
                "San Borja", "Av. San Borja Norte 850", "Familiar", "-12.0991", "-76.9972", "250.00", 6, 3, 2, true, true, false));
        lista.add(depa(3L, "Roberto Mendoza", "Mini depa céntrico y económico", "Cerca a universidades y centros comerciales.",
                "Lince", "Av. Arenales 2100", "Moderno", "-12.0834", "-77.0345", "120.00", 2, 1, 1, false, true, false));
        lista.add(depa(1L, "Alonso Vargas", "Penthouse de lujo con terraza", "Jacuzzi privado y parrilla en la azotea.",
                "Miraflores", "Av. Pardo 1020", "Moderno", "-12.1172", "-77.0355", "450.00", 4, 2, 3, false, true, false));
        lista.add(depa(2L, "Mariana Silva", "Depa Flat muy iluminado", "Balcón amplio, excelente ventilación.",
                "Jesús María", "Av. Salaverry 1500", "Moderno", "-12.0789", "-77.0456", "140.00", 3, 2, 1, false, true, false));
        lista.add(depa(3L, "Roberto Mendoza", "Casa de playa remodelada", "Condominio exclusivo con salida directa al mar.",
                "Chorrillos", "Malecón Costa Sur 300", "Playa", "-12.1701", "-77.0222", "320.00", 8, 4, 3, true, true, false));
        lista.add(depa(1L, "Alonso Vargas", "Departamento Pet-Friendly", "Ubicado frente a un parque grande, se aceptan mascotas.",
                "Magdalena del Mar", "Jirón Leoncio Prado 500", "Familiar", "-12.0915", "-77.0653", "135.00", 3, 2, 1, false, true, true));

        LocalDateTime ahora = LocalDateTime.now();
        for (int i = 0; i < lista.size(); i++) {
            lista.get(i).setImagenUrl(IMAGENES[i % IMAGENES.length]);
            lista.get(i).setFechaPublicacion(ahora.minusDays(lista.size() - i));
        }
        repo.saveAll(lista);
        log.info("{} departamentos de ejemplo creados.", lista.size());
    }

    private static Departamento depa(Long idPropietario, String propietario, String titulo, String descripcion,
                                     String distrito, String direccion, String categoria, String lat, String lon,
                                     String precio, int capacidad, int habitaciones, int banos,
                                     boolean piscina, boolean wifi, boolean mascotas) {
        Departamento d = new Departamento();
        d.setIdPropietario(idPropietario);
        d.setPropietarioNombre(propietario);
        d.setTitulo(titulo);
        d.setDescripcion(descripcion);
        d.setDistrito(distrito);
        d.setDireccion(direccion);
        d.setCategoria(categoria);
        d.setLatitud(new BigDecimal(lat));
        d.setLongitud(new BigDecimal(lon));
        d.setPrecioNoche(new BigDecimal(precio));
        d.setCapacidadPersonas(capacidad);
        d.setHabitaciones(habitaciones);
        d.setBanos(banos);
        d.setTienePiscina(piscina);
        d.setTieneWifi(wifi);
        d.setAdmiteMascotas(mascotas);
        return d;
    }
}
