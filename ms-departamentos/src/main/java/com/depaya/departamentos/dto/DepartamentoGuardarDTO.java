package com.depaya.departamentos.dto;

import com.depaya.departamentos.model.EstadoDepartamento;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

// Cuerpo de POST y PUT. idPropietario solo lo usa el ADMIN.
@Data
public class DepartamentoGuardarDTO {

    private Long idPropietario;

    @NotBlank(message = "El título es obligatorio.")
    @Size(max = 200)
    private String titulo;

    @NotBlank(message = "La descripción es obligatoria.")
    @Size(max = 2000)
    private String descripcion;

    @NotBlank(message = "El distrito es obligatorio.")
    @Size(max = 100)
    private String distrito;

    @NotBlank(message = "La dirección es obligatoria.")
    @Size(max = 250)
    private String direccion;

    @NotBlank(message = "La categoría es obligatoria.")
    @Pattern(regexp = "Playa|Moderno|Vista al mar|Loft|Ejecutivo|Familiar",
            message = "Categoría válida: Playa, Moderno, Vista al mar, Loft, Ejecutivo o Familiar.")
    private String categoria;

    @DecimalMin(value = "-90", message = "La latitud debe estar entre -90 y 90.")
    @DecimalMax(value = "90", message = "La latitud debe estar entre -90 y 90.")
    private BigDecimal latitud;

    @DecimalMin(value = "-180", message = "La longitud debe estar entre -180 y 180.")
    @DecimalMax(value = "180", message = "La longitud debe estar entre -180 y 180.")
    private BigDecimal longitud;

    @NotNull(message = "El precio por noche es obligatorio.")
    @DecimalMin(value = "0.01", message = "El precio por noche debe ser mayor a 0.")
    @Digits(integer = 8, fraction = 2, message = "El precio admite hasta 2 decimales.")
    private BigDecimal precioNoche;

    @NotNull(message = "La capacidad es obligatoria.")
    @Min(value = 1, message = "La capacidad mínima es 1 persona.")
    private Integer capacidadPersonas;

    @NotNull(message = "Las habitaciones son obligatorias.")
    @Min(value = 1, message = "Debe tener al menos 1 habitación.")
    private Integer habitaciones;

    @NotNull(message = "Los baños son obligatorios.")
    @Min(value = 1, message = "Debe tener al menos 1 baño.")
    private Integer banos;

    @NotBlank(message = "La URL de la imagen es obligatoria.")
    @Size(max = 500)
    private String imagenUrl;

    private boolean tienePiscina;
    private boolean tieneWifi;
    private boolean admiteMascotas;

    // Opcional. Al crear es DISPONIBLE; al editar, null lo deja igual.
    private EstadoDepartamento estado;
}
