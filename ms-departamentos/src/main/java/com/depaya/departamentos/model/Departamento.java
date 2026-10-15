package com.depaya.departamentos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "departamento", schema = "dep")
@Getter
@Setter
@NoArgsConstructor
public class Departamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Id del PROPIETARIO (usuario de ms-auth).
    @Column(name = "id_propietario", nullable = false)
    private Long idPropietario;

    // Copia del nombre del propietario para mostrarlo en la lista.
    @Column(name = "propietario_nombre", nullable = false, length = 200)
    private String propietarioNombre;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, length = 2000)
    private String descripcion;

    @Column(nullable = false, length = 100)
    private String distrito;

    @Column(nullable = false, length = 250)
    private String direccion;

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(name = "precio_noche", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioNoche;

    @Column(name = "capacidad_personas", nullable = false)
    private Integer capacidadPersonas;

    @Column(nullable = false)
    private Integer habitaciones;

    @Column(nullable = false)
    private Integer banos;

    @Column(name = "imagen_url", nullable = false, length = 500)
    private String imagenUrl;

    @Column(name = "tiene_piscina", nullable = false)
    private boolean tienePiscina;

    @Column(name = "tiene_wifi", nullable = false)
    private boolean tieneWifi;

    @Column(name = "admite_mascotas", nullable = false)
    private boolean admiteMascotas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoDepartamento estado = EstadoDepartamento.DISPONIBLE;

    @Column(name = "fecha_publicacion", nullable = false, updatable = false)
    private LocalDateTime fechaPublicacion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaPublicacion == null) {
            fechaPublicacion = LocalDateTime.now();
        }
    }
}
