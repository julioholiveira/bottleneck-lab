# Bottleneck Lab

Laboratório de testes para a biblioteca Bottleneck com integração RabbitMQ e Temporal.

## 📋 Descrição

Este repositório serve como um laboratório de testes para a biblioteca Bottleneck, implementando um sistema completo de controle de taxa (rate limiting) entre RabbitMQ e Temporal. O sistema garante que o Temporal não seja sobrecarregado com muitas solicitações em um curto período de tempo, utilizando Redis como backend distribuído para o Bottleneck.

**✅ Sistema validado com testes de até 50.000 mensagens, demonstrando rate limiting preciso e confiável.**

## 🏗️ Arquitetura

O sistema implementa o seguinte fluxo de mensagens:

```
Producer → RabbitMQ → Consumer (Bottleneck) → Temporal → Worker → Activity
                         ↓
                      Redis
```

### Componentes

- **Producer**: Envia mensagens para o RabbitMQ com IDs únicos (UUID)
- **Consumer**: Consome mensagens do RabbitMQ e aplica rate limiting com Bottleneck antes de enviar para o Temporal
- **Worker**: Processa workflows e activities do Temporal
- **Bottleneck**: Controla a taxa de requisições usando Redis como datastore
- **Redis**: Armazena o estado do Bottleneck para ambientes distribuídos
- **RabbitMQ**: Fila de mensagens com prefetch configurado
- **Temporal**: Orquestrador de workflows
- **PostgreSQL**: Banco de dados do Temporal

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.0.0
- Docker e Docker Compose
- npm

### 1. Clonar o repositório

```bash
git clone https://github.com/julioholiveira/bottleneck-lab
cd bottleneck_lab
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário. Principais configurações:

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=bottleneck-queue
RABBITMQ_PREFETCH_COUNT=10

# Redis Configuration (for Bottleneck)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                     # Opcional: senha do Redis
REDIS_DB=0                          # Database do Redis (padrão: 0)

# Bottleneck Configuration - Rate Limiting
MAX_CONCURRENT=50                   # Máximo de execuções simultâneas (prefetch alinhado automaticamente)
MIN_TIME=20                         # Tempo mínimo entre execuções (ms)

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=bottleneck-task-queue

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info                      # Níveis: error, warn, info, debug
```

### 4. Build do projeto

```bash
npm run build
```

## 🐳 Executando com Docker

### Iniciar toda a infraestrutura

```bash
# Iniciar todos os serviços (RabbitMQ, Redis, PostgreSQL, Temporal, etc.)
docker-compose up -d

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f temporal
docker-compose logs -f rabbitmq
docker-compose logs -f redis
```

### Verificar status dos serviços

```bash
docker-compose ps
```

Todos os serviços devem estar com status "healthy":

- `bottleneck-rabbitmq` (porta 5672, UI: 15672)
- `bottleneck-redis` (porta 6379)
- `bottleneck-postgres` (porta 5432)
- `bottleneck-temporal` (porta 7233)
- `bottleneck-temporal-ui` (porta 8080)

### Parar os serviços

```bash
# Parar e remover containers
docker-compose down

# Parar, remover containers e volumes (limpa dados)
docker-compose down -v
```

## 💻 Executando localmente (sem Docker para a aplicação)

### 1. Iniciar infraestrutura (RabbitMQ, Redis, Temporal)

```bash
docker-compose up -d rabbitmq redis postgres temporal temporal-ui
```

### 2. Iniciar o Temporal Worker

Em um terminal:

```bash
npm run worker
```

Você verá:

```
[Worker] INFO: Connecting to Temporal at localhost:7233
[Worker] INFO: Creating worker...
[Worker] INFO: Worker started, polling task queue: bottleneck-task-queue
```

### 3. Iniciar o Consumer

Em outro terminal:

```bash
npm run consumer
```

Você verá:

```
[RabbitMQService] INFO: Successfully connected to RabbitMQ
[BottleneckService] INFO: Bottleneck initialized with Redis datastore
[TemporalService] INFO: Successfully connected to Temporal
[Consumer] INFO: Consumer is running. Press Ctrl+C to stop.
```

### 4. Enviar mensagens com o Producer

Em um terceiro terminal:

```bash
# Enviar 1 mensagem
npm run producer

# Enviar 10 mensagens
npm run producer -- --count 10

# Enviar 100 mensagens
npm run producer -- --count 100
```

Em ambiente Windows:

```powershell
# Enviar 50 mensagens
npm run producer -- --count 50
```

## 📊 Monitoramento

### RabbitMQ Management UI

Acesse: http://localhost:15672

- Usuário: `guest`
- Senha: `guest`

Aqui você pode:

- Ver filas e suas mensagens
- Monitorar taxa de publicação/consumo
- Ver conexões ativas

### Temporal UI

Acesse: http://localhost:8080

Aqui você pode:

- Ver todos os workflows executados
- Verificar status de workflows (Running, Completed, Failed)
- Ver histórico de execução de cada workflow
- Debugar workflows com problemas

### Logs do Consumer

O Consumer exibe estatísticas a cada 10 segundos:

```
[Consumer] INFO: Stats - Processed: 45, Errors: 0, Bottleneck: {"RECEIVED":50,"QUEUED":5,"RUNNING":5,"EXECUTING":2}
```

- **Processed**: Total de mensagens processadas com sucesso
- **Errors**: Total de mensagens com erro
- **RECEIVED**: Total de jobs recebidos pelo Bottleneck
- **QUEUED**: Jobs na fila aguardando execução
- **RUNNING**: Jobs em execução no momento
- **EXECUTING**: Jobs sendo executados atualmente

## 🧪 Testes

### Executar todos os testes

```bash
npm test
```

### Testes com watch mode

```bash
npm run test:watch
```

### Testes de integração

```bash
npm run test:integration
```

### Coverage

```bash
npm run test:coverage
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run build          # Compila TypeScript para JavaScript
npm run dev            # Modo de desenvolvimento
npm start              # Inicia a aplicação compilada

# Qualidade de código
npm run lint           # Verifica código com ESLint
npm run lint:fix       # Corrige problemas do ESLint automaticamente
npm run format         # Formata código com Prettier

# Testes
npm test               # Executa testes
npm run test:watch     # Testes em modo watch
npm run test:coverage  # Gera relatório de cobertura
npm run test:integration  # Testes de integração

# Aplicação
npm run producer       # Executa o producer
npm run consumer       # Executa o consumer
npm run worker         # Executa o Temporal worker
```

## 📝 Estrutura do Projeto

```
bottleneck_lab/
├── src/
│   ├── config/              # Configurações da aplicação
│   │   └── index.ts         # Carrega env vars e exporta configs
│   ├── services/            # Serviços da aplicação
│   │   ├── rabbitmq.service.ts    # Gerencia RabbitMQ
│   │   ├── bottleneck.service.ts  # Gerencia Bottleneck + Redis
│   │   ├── temporal.service.ts    # Cliente Temporal
│   │   └── index.ts
│   ├── temporal/            # Workflows e Activities do Temporal
│   │   ├── workflows/
│   │   │   ├── processMessage.workflow.ts
│   │   │   └── index.ts
│   │   └── activities/
│   │       ├── processMessage.activity.ts
│   │       └── index.ts
│   ├── utils/               # Utilitários
│   │   ├── logger.ts        # Logger com contextos
│   │   ├── message-generator.ts  # Gera mensagens de teste
│   │   └── index.ts
│   ├── models/              # Interfaces TypeScript
│   │   └── index.ts
│   ├── producer.ts          # Producer principal
│   ├── consumer.ts          # Consumer principal
│   └── worker.ts            # Temporal Worker
├── tests/                   # Testes unitários e integração
├── docs/                    # Documentação adicional
├── examples/                # Exemplos de uso
├── docker-compose.yml       # Orquestração Docker
├── Dockerfile              # Imagem da aplicação
├── tsconfig.json           # Configuração TypeScript
├── jest.config.js          # Configuração Jest
├── .eslintrc.js            # Configuração ESLint
└── package.json            # Dependências e scripts
```

## ⚙️ Configuração do Bottleneck

O Bottleneck pode ser ajustado através das variáveis de ambiente:

### `MAX_CONCURRENT` (padrão: 50)

Número máximo de jobs executando simultaneamente.

**Configurações testadas**:

- **Desenvolvimento**: MAX_CONCURRENT=50 (padrão)
- **Alta carga**: MAX_CONCURRENT=200 (testado com 50.000 mensagens)

### `RABBITMQ_PREFETCH_COUNT` (padrão: 10)

Número máximo de mensagens não confirmadas que o RabbitMQ enviará ao consumer. Este valor controla quantas mensagens o consumer pode ter "em processamento" antes que o RabbitMQ pare de enviar novas mensagens.

**Recomendação**: Configure este valor considerando o `MAX_CONCURRENT` do Bottleneck. Um valor muito baixo pode subutilizar o Bottleneck, enquanto um valor muito alto pode acumular mensagens na memória.

### Como verificar se o Bottleneck está funcionando

Monitore a fila do RabbitMQ para verificar o número de mensagens não confirmadas:

```bash
curl -s -u guest:guest http://localhost:15672/api/queues/%2F/bottleneck-queue | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Unack: {d[\"messages_unacknowledged\"]}')"
```

Durante o processamento de carga, este valor deve permanecer próximo ao `RABBITMQ_PREFETCH_COUNT` configurado, confirmando que o RabbitMQ está controlando o fluxo adequadamente.

### `MIN_TIME` (padrão: 20ms)

Tempo mínimo entre cada execução. Define o intervalo mínimo que deve passar entre o início de dois jobs consecutivos. Com `MIN_TIME=20`, você pode processar até 50 jobs por segundo por worker.

## 🎯 Cenários de Teste

### Teste 1: Rate Limiting Básico ✅

```bash
# Terminal 1: Worker
npm run worker

# Terminal 2: Consumer
npm run consumer

# Terminal 3: Enviar 100 mensagens rapidamente
npm run producer -- --count 100
```

Observe no Consumer que o Bottleneck limita a taxa de processamento conforme configurado.

**Resultado validado**: 100 mensagens processadas com sucesso com MAX_CONCURRENT padrão.

### Teste 2: Volume Médio (5.000 mensagens) ✅

```bash
# Enviar 5.000 mensagens
npm run producer -- --count 5000
```

Monitore o rate limiting em tempo real:

```bash
watch -n 1 'curl -s -u guest:guest http://localhost:15672/api/queues/%2F/bottleneck-queue | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Total: {d[\"messages\"]:,} | Unack: {d[\"messages_unacknowledged\"]}\")"
```

**Resultado validado**: 5.000 mensagens processadas com 100% de sucesso. Com MAX_CONCURRENT=200, manteve exatamente 200 `messages_unacknowledged` durante o processamento.

### Teste 3: Alta Carga (50.000 mensagens) ✅

```bash
# Enviar 50.000 mensagens
npm run producer -- --count 50000
```

**Resultado validado**:

- 50.000 mensagens processadas com 100% de sucesso
- Rate limiting preciso: exatamente 200 `messages_unacknowledged` durante toda a execução
- Throughput médio: ~422 msg/s (pico: 1.500 msg/s)
- Duração total: ~2 minutos

### Scripts de Teste Automatizados

O repositório inclui scripts Python para testes automatizados com monitoramento:

```bash
# Teste de carga com 5.000 mensagens e monitoramento automático
python3 test_load_5k.py

# Teste de carga com 50.000 mensagens
python3 test_load.py

# Monitoramento contínuo do Bottleneck
python3 test_bottleneck.py
```

Veja o relatório completo de testes em [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## 🐛 Troubleshooting

### RabbitMQ não conecta

Verifique se o container está rodando:

```bash
docker-compose ps rabbitmq
docker-compose logs rabbitmq
```

### Temporal não conecta

Aguarde o Temporal ficar "healthy":

```bash
docker-compose ps temporal
```

Se necessário, reinicie:

```bash
docker-compose restart temporal
```

### Redis não conecta

Verifique o container:

```bash
docker-compose ps redis
docker-compose logs redis
```

### Worker não processa workflows

1. Verifique se o Worker está rodando
2. Verifique se a task queue está correta (deve ser `bottleneck-task-queue`)
3. Acesse a Temporal UI e veja se há workflows pendentes

### Mensagens não são consumidas

1. Verifique se o Consumer está rodando
2. Verifique a fila no RabbitMQ Management UI
3. Veja os logs do Consumer para erros

### Bottleneck permite mais mensagens do que MAX_CONCURRENT

**Problema comum**: Se você observar 400 `messages_unacknowledged` ao invés de 200, isso indica que há **múltiplos consumers** rodando simultaneamente.

**Diagnóstico**:

1. Acesse RabbitMQ Management UI: http://localhost:15672
2. Vá em Queues → bottleneck-queue → Consumers
3. Verifique quantos consumers estão conectados

**Causa**: Executar o consumer tanto no host (`npm run consumer`) quanto no Docker (`docker-compose up consumer`) resulta em 2 consumers × 200 prefetch = 400 mensagens simultâneas.

**Solução**:

```bash
# Parar o consumer no Docker
docker stop bottleneck-consumer

# OU parar o consumer no host e usar apenas o Docker
# Ctrl+C no terminal onde o consumer está rodando
```

**Verificação**: Após parar um dos consumers, o `messages_unacknowledged` deve estabilizar em 200.

### Como verificar se o rate limiting está funcionando

```bash
# Comando único para verificar
curl -s -u guest:guest http://localhost:15672/api/queues/%2F/bottleneck-queue | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {d[\"messages\"]:,} | Unack: {d[\"messages_unacknowledged\"]}')"

# Monitoramento contínuo (atualiza a cada segundo)
watch -n 1 'curl -s -u guest:guest http://localhost:15672/api/queues/%2F/bottleneck-queue | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Total: {d[\"messages\"]:,} | Unack: {d[\"messages_unacknowledged\"]}\")"
```

**Valores esperados**:

- `messages_unacknowledged` deve ser aproximadamente igual ao `MAX_CONCURRENT` configurado
- Durante processamento ativo, este valor permanece estável
- Quando não há mensagens, o valor cai para 0

**Exemplo**: Com MAX_CONCURRENT=50, espera-se ~50 mensagens não confirmadas. Com MAX_CONCURRENT=200, espera-se ~200.

## 📚 Referências

- [Bottleneck Documentation](https://www.npmjs.com/package/bottleneck)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [RabbitMQ Prefetch Documentation](https://www.rabbitmq.com/confirms.html#channel-qos-prefetch)
- [Temporal Documentation](https://docs.temporal.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Test Report](docs/TEST_REPORT.md) - Relatório completo dos testes de validação

## 📄 Licença

MIT

---

**Desenvolvido como laboratório de experimentação com rate limiting distribuído usando Bottleneck, RabbitMQ e Temporal.**
