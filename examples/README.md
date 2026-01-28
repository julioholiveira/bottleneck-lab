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
MAX_CONCURRENT=5
RESERVOIR=100
RESERVOIR_REFRESH_AMOUNT=100
RESERVOIR_REFRESH_INTERVAL=60000
```

## Cenários de Teste

1. **Alta Concorrência**: Aumentar `MAX_CONCURRENT` para 10+
2. **Limite de Requisições**: Usar `RESERVOIR` com valores baixos
3. **Recuperação Gradual**: Ajustar `RESERVOIR_REFRESH_INTERVAL`
