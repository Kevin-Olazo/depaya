package com.depaya.reservas.model;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

// Copia datos del departamento y de las personas para listar sin consultar otros servicios.
@Entity
@Table(name = "reserva", schema = "res")
@Getter
@Setter
@NoArgsConstructor
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_departamento", nullable = false)
    private Long idDepartamento;

    @Column(name = "id_inquilino", nullable = false)
    private Long idInquilino;

    @Column(name = "id_propietario", nullable = false)
    private Long idPropietario;

    @Column(name = "departamento_titulo", nullable = false, length = 200)
    private String departamentoTitulo;

    @Column(nullable = false, length = 100)
    private String distrito;

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(name = "inquilino_nombre", nullable = false, length = 200)
    private String inquilinoNombre;

    @Column(name = "inquilino_correo", nullable = false, length = 150)
    private String inquilinoCorreo;

    @Column(name = "propietario_nombre", nullable = false, length = 200)
    private String propietarioNombre;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDate fechaSalida;

    @Column(nullable = false)
    private Integer noches;

    @Column(name = "cantidad_huespedes", nullable = false)
    private Integer cantidadHuespedes;

    @Column(name = "precio_noche", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioNoche;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_reembolso", nullable = false, length = 20)
    private EstadoReembolso estadoReembolso = EstadoReembolso.NO_APLICA;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_reembolso", length = 20)
    private MetodoPago metodoReembolso;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    @Column(name = "fecha_solicitud_reembolso")
    private LocalDateTime fechaSolicitudReembolso;

    @Column(name = "fecha_limite_reembolso")
    private LocalDateTime fechaLimiteReembolso;

    @Column(name = "fecha_reembolso")
    private LocalDateTime fechaReembolso;

    @PrePersist
    void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }
}
