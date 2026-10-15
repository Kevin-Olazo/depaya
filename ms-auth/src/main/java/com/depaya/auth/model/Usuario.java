package com.depaya.auth.model;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario", schema = "usr")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(name = "tipo_documento", nullable = false, length = 20)
    private String tipoDocumento;

    @Column(name = "numero_documento", nullable = false, unique = true, length = 20)
    private String numeroDocumento;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(nullable = false, length = 15)
    private String telefono;

    // Hash BCrypt.
    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "publicaciones_habilitadas", nullable = false)
    private boolean publicacionesHabilitadas = true;

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_desactivacion")
    private LocalDateTime fechaDesactivacion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }
}
