package com.depaya.pagos.model;

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

// Pago simulado, sin datos de tarjeta. Copia datos de la reserva para listar sin consultarla.
@Entity
@Table(name = "pago", schema = "pag")
@Getter
@Setter
@NoArgsConstructor
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_reserva", nullable = false)
    private Long idReserva;

    @Column(name = "id_inquilino", nullable = false)
    private Long idInquilino;

    @Column(name = "inquilino_nombre", nullable = false, length = 200)
    private String inquilinoNombre;

    @Column(name = "inquilino_correo", nullable = false, length = 150)
    private String inquilinoCorreo;

    @Column(name = "id_propietario", nullable = false)
    private Long idPropietario;

    @Column(name = "departamento_titulo", nullable = false, length = 200)
    private String departamentoTitulo;

    @Column(nullable = false, length = 100)
    private String distrito;

    // Total de la reserva.
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    // Parte de DepaYa.
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal comision;

    // Parte del propietario (monto - comisión).
    @Column(name = "monto_propietario", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoPropietario;

    @Column(nullable = false, length = 3)
    private String moneda = "PEN";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoPago metodo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private EstadoPago estado = EstadoPago.PROCESANDO;

    @Column(name = "referencia_pasarela", length = 100)
    private String referenciaPasarela;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_reembolso", length = 20)
    private MetodoPago metodoReembolso;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

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
