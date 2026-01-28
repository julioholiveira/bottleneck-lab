# Documentação do Bottleneck Lab

## Visão Geral

O Bottleneck Lab é um ambiente de testes para experimentação com controle de taxa (rate limiting) usando a biblioteca Bottleneck em conjunto com RabbitMQ e Temporal.

## Componentes

### 1. Producer

Responsável por enviar mensagens para o RabbitMQ.

### 2. Consumer

Consome mensagens do RabbitMQ e aplica rate limiting antes de enviá-las para o Temporal.

### 3. Worker

Processa os workflows no Temporal.

### 4. Bottleneck

Gerencia o rate limiting usando Redis como backend para persistência do estado.

## Fluxo de Dados

```
Producer → RabbitMQ → Consumer (Bottleneck) → Temporal → Worker
                         ↓
                      Redis
```

## Configurações do Bottleneck

A biblioteca Bottleneck oferece várias opções de configuração:

- **maxConcurrent**: Número máximo de jobs executando simultaneamente
- **minTime**: Tempo mínimo entre o início de cada job (em ms)
- **reservoir**: Número máximo de jobs que podem ser executados em um período
- **reservoirRefreshAmount**: Quantidade que o reservoir é reabastecido
- **reservoirRefreshInterval**: Intervalo de tempo para reabastecimento (em ms)

## Referências

- [Bottleneck Documentation](https://www.npmjs.com/package/bottleneck)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Temporal Documentation](https://docs.temporal.io/)
