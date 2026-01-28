# Plan: Criar Producer RabbitMQ

O producer enviará mensagens para o RabbitMQ usando a configuração já existente, seguindo os padrões TypeScript do projeto e utilizando a interface Message definida.

## Steps

1. **Criar RabbitMQ Service** em `src/services/rabbitmq.service.ts` - classe para gerenciar conexão com RabbitMQ, publicar mensagens usando `amqplib`, e garantir cleanup adequado da conexão.

2. **Criar Producer principal** em `src/producer.ts` - arquivo de entrada que inicializa o `RabbitMQService`, gera mensagens seguindo a interface `Message` de `src/models/index.ts`, e utiliza o `Logger` de `src/utils/logger.ts` para logging.

3. **Adicionar gerador de mensagens** em `src/utils/message-generator.ts` - função utilitária para criar mensagens com IDs únicos (UUID), timestamps, e payloads customizáveis para facilitar testes de carga.

4. **Criar barrel export** em `src/services/index.ts` - exportar o `RabbitMQService` para manter padrão de imports limpos usado no projeto.

## Further Considerations

1. **Argumentos CLI**: O producer deve aceitar argumentos como `--count` para enviar múltiplas mensagens automaticamente? Recomendação: Sim, para facilitar testes de carga.

2. **Intervalo entre mensagens**: Adicionar delay configurável entre envios no producer ou deixar isso apenas para o consumer com Bottleneck? Recomendação: Producer envia rápido, consumer controla com Bottleneck.

3. **Graceful shutdown**: Implementar handlers para SIGINT/SIGTERM no producer para fechar conexão RabbitMQ adequadamente? Recomendação: Sim, sempre importante para cleanup de recursos.
