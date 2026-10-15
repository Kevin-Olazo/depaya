package com.depaya.auth.dto;

import com.depaya.auth.model.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Registro público y creación de usuarios por el ADMIN.
@Data
public class UsuarioCrearDTO {

    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 100)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio.")
    @Size(max = 100)
    private String apellido;

    @NotBlank(message = "El tipo de documento es obligatorio.")
    @Pattern(regexp = "DNI|CE|PASAPORTE", message = "El tipo de documento debe ser DNI, CE o PASAPORTE.")
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio.")
    @Size(max = 20)
    private String numeroDocumento;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo no es válido.")
    @Size(max = 150)
    private String correo;

    @NotBlank(message = "El teléfono es obligatorio.")
    @Size(max = 15)
    private String telefono;

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres.")
    private String password;

    @NotNull(message = "El rol es obligatorio.")
    private Rol rol;
}
