package com.depaya.departamentos.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    // Builder normal: los clientes lo piden sin @LoadBalanced y llaman por URL completa.
    @Bean
    @Primary
    RestClient.Builder restClientBuilderNormal() {
        return RestClient.builder();
    }

    // Builder balanceado: los clientes lo piden con @LoadBalanced y llaman por nombre de servicio.
    @Bean
    @LoadBalanced
    RestClient.Builder restClientBuilderBalanceado() {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(3));
        fabrica.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder().requestFactory(fabrica);
    }
}
