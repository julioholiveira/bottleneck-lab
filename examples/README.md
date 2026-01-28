# Exemplo Básico de Uso do Bottleneck

Este exemplo demonstra como usar o Bottleneck para controlar a taxa de requisições.

## Executando o exemplo

```bash
npm install
npm run dev
```

## Configuração

Ajuste as variáveis no arquivo `.env` para experimentar diferentes configurações:

```env
RATE_LIMIT_MAX_CONCURRENT=5
RATE_LIMIT_MIN_TIME=200
RATE_LIMIT_RESERVOIR=100
RATE_LIMIT_RESERVOIR_REFRESH_AMOUNT=100
RATE_LIMIT_RESERVOIR_REFRESH_INTERVAL=60000
```

## Cenários de Teste

1. **Alta Concorrência**: Aumentar `MAX_CONCURRENT` para 10+
2. **Rate Limiting Agressivo**: Reduzir `MIN_TIME` para 50ms
3. **Limite de Requisições**: Usar `RESERVOIR` com valores baixos
4. **Recuperação Gradual**: Ajustar `RESERVOIR_REFRESH_INTERVAL`
