package com.depaya.pagos.util;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.util.List;

public final class Csv {

    private Csv() {
    }

    // Arma la respuesta CSV (UTF-8 con BOM para que Excel respete las tildes).
    public static ResponseEntity<byte[]> respuesta(String archivo, List<String> cabecera, List<List<Object>> filas) {
        StringBuilder sb = new StringBuilder("﻿");
        sb.append(String.join(",", cabecera)).append("\r\n");
        for (List<Object> fila : filas) {
            for (int i = 0; i < fila.size(); i++) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(celda(fila.get(i)));
            }
            sb.append("\r\n");
        }
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(archivo).build().toString())
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    private static String celda(Object valor) {
        if (valor == null) {
            return "";
        }
        String texto = valor.toString();
        if (texto.contains(",") || texto.contains("\"") || texto.contains("\n") || texto.contains("\r")) {
            return "\"" + texto.replace("\"", "\"\"") + "\"";
        }
        return texto;
    }
}
