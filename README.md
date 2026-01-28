# Bottleneck Lab

Laboratório de testes para a biblioteca Bottleneck com integração RabbitMQ e Temporal.

## 📋 Descrição

Este repositório serve como um laboratório de testes para a biblioteca Bottleneck, implementando um sistema completo de controle de taxa (rate limiting) entre RabbitMQ e Temporal. O sistema garante que o Temporal não seja sobrecarregado com muitas solicitações em um curto período de tempo, utilizando Redis como backend distribuído para o Bottleneck.

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
- **RabbitMQ**: Fila de mensagens
- **Temporal**: Orquestrador de workflows
- **PostgreSQL**: Banco de dados do Temporal

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.0.0
- Docker e Docker Compose
- npm

### 1. Clonar o repositório

```bash
git clone <repository-url>
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
# RABBITMQ_EXCHANGE=                # Opcional: use exchange e routing key
# RABBITMQ_ROUTING_KEY=             # ao invés de envio direto para a fila

# Redis Configuration (for Bottleneck)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                     # Opcional: senha do Redis
REDIS_DB=0                          # Database do Redis (padrão: 0)

# Bottleneck Configuration - Rate Limiting
MAX_CONCURRENT=200                  # Máximo de execuções simultâneas
# RESERVOIR=100                     # Opcional: Limite total de execuções
# RESERVOIR_REFRESH_AMOUNT=100      # Opcional: Quantidade de reposição
# RESERVOIR_REFRESH_INTERVAL=60000  # Opcional: Intervalo de reposição (ms)

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

# Enviar 50 mensagens com intervalo de 10ms entre elas
npm run producer -- --count 50 --interval 10
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

### `MAX_CONCURRENT` (padrão: 5)

Número máximo de jobs executando simultaneamente.

### `RESERVOIR` (padrão: 100)

Número máximo de jobs que podem ser executados em um período. Quando o reservoir se esgota, novos jobs aguardam o refresh. Esta variável é opcional.

### `RESERVOIR_REFRESH_AMOUNT` (padrão: 100)

Quantidade que o reservoir é reabastecido a cada intervalo. Esta variável é opcional.

### `RESERVOIR_REFRESH_INTERVAL` (padrão: 60000ms)

Intervalo de tempo para reabastecimento do reservoir. Esta variável é opcional.

## 🎯 Cenários de Teste

### Teste 1: Rate Limiting Básico

```bash
# Terminal 1: Worker
npm run worker

# Terminal 2: Consumer
npm run consumer

# Terminal 3: Enviar 100 mensagens rapidamente
npm run producer -- --count 100
```

Observe no Consumer que o Bottleneck limita a taxa de processamento conforme configurado.

### Teste 2: Alta Concorrência

Ajuste `.env`:

```env
MAX_CONCURRENT=10
```

Reinicie consumer e envie 200 mensagens:

```bash
npm run producer -- --count 200
```

### Teste 3: Limite de Reservoir

Ajuste `.env`:

```env
RESERVOIR=50
RESERVOIR_REFRESH_AMOUNT=50
RESERVOIR_REFRESH_INTERVAL=10000
```

Envie 100 mensagens e observe o Bottleneck depleting:

```bash
npm run producer -- --count 100
```

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

## 📚 Referências

- [Bottleneck Documentation](https://www.npmjs.com/package/bottleneck)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Temporal Documentation](https://docs.temporal.io/)
- [Redis Documentation](https://redis.io/documentation)

## 📄 Licença

MIT

---

**Desenvolvido como laboratório de experimentação com rate limiting distribuído usando Bottleneck, RabbitMQ e Temporal.**
npm run build

# Executar producer

npm run producer

# Executar consumer (em outro terminal)

npm run consumer

# Executar worker (em outro terminal)

npm run worker

````

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com watch mode
npm run test:watch

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
````

## 📝 Scripts Disponíveis

- `npm run build` - Compila o TypeScript
- `npm start` - Inicia a aplicação
- `npm run dev` - Modo de desenvolvimento
- `npm test` - Executa os testes
- `npm run lint` - Verifica código com ESLint
- `npm run lint:fix` - Corrige problemas do ESLint
- `npm run format` - Formata código com Prettier

## 🔧 Configuração

As configurações do Bottleneck podem ser ajustadas no arquivo `.env`:

- `MAX_CONCURRENT`: Número máximo de execuções simultâneas
- `RESERVOIR`: Limite total de execuções (opcional)
- `RESERVOIR_REFRESH_AMOUNT`: Quantidade de reposição (opcional)
- `RESERVOIR_REFRESH_INTERVAL`: Intervalo de reposição (ms, opcional)

## 📊 Interfaces Web

- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Temporal UI**: http://localhost:8080

## 📚 Documentação

Veja a pasta [docs/](docs/) para documentação adicional sobre:

- Configuração do Bottleneck
- Arquitetura do sistema
- Exemplos de uso

## 🤝 Contribuindo

Este é um projeto de laboratório experimental. Sinta-se à vontade para explorar e modificar.

## 📄 Licença

MIT
