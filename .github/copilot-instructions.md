# Laboratório de testes da biblioteca Bottleneck

## Descrição
Este repositório serve como um laboratório de testes para a biblioteca Bottleneck, que é uma biblioteca de limitação de taxa para Node.js e navegadores. O objetivo deste laboratório é experimentar diferentes configurações e cenários de uso da biblioteca Bottleneck para entender melhor seu comportamento e desempenho.

O Bottleneck deverá limitar a taxa (rate limit) entre um RabbitMq e Temporal, ou seja, o sistema deverá enviar uma mensagem para o RabbitMq e o Bottleneck deverá controlar a taxa de consumo dessas mensagens para o Temporal, garantindo que o Temporal não seja sobrecarregado com muitas solicitações em um curto período de tempo.

Será utilizado o Context7 via MCP para a geração de código, garantindo que todas as implementações sigam as melhores práticas e padrões estabelecidos.

Utilizar TypeScript para garantir tipagem estática e maior robustez no código.

Devemos ter um código que envia mensagens para o RabbitMq e outro que consome essas mensagens, aplicando a limitação de taxa com o Bottleneck antes de enviá-las para o Temporal.

O Bottleneck deve ser configurado para permitir um número específico de solicitações por segundo, e esse valor deve ser facilmente ajustável para testar diferentes cenários de carga, preferencialmente via variáveis de ambiente.

O Bottleneck deve usar Redis como armazenamento para gerenciar o estado da limitação de taxa, garantindo que a limitação funcione corretamente mesmo em ambientes distribuídos.

O Temporal deve ser executado localmente usando Docker para facilitar os testes e garantir um ambiente controlado.

Os testes devem usar Jest para validar o comportamento do Bottleneck sob diferentes condições de carga e configuração.

O Eslint deve ser configurado para manter a qualidade do código e garantir a aderência às melhores práticas de desenvolvimento.

A estrutura do Temporal Worker deve ser separada do código de envio e consumo de mensagens, promovendo uma arquitetura modular e de fácil manutenção.

Adicionar os scripts necessários no `package.json` para facilitar a execução dos testes, linting e outras tarefas comuns de desenvolvimento.

Deve existir testes de integração para garantir que o fluxo completo de envio de mensagens do RabbitMq para o Temporal, passando pelo Bottleneck, funcione conforme o esperado.

O producer deverá enviar uma mensagem simples para o RabbitMq, que será consumida pelo consumer. O consumer aplicará a limitação de taxa usando o Bottleneck antes de enviar a mensagem para o Temporal Worker, que processará a mensagem e registrará o resultado.

Deve existir um script para envio de múltiplas mensagens ao RabbitMq para simular uma carga alta e testar a eficácia do Bottleneck na limitação da taxa de consumo. A quantidade de mensagem envidas pode ser configurada diretamente no código deste script.

Não há necessidade de adicionar um delay configurável entre os envios das mensagens no producer, o foco é testar a limitação de taxa no consumo.

Implementar handlers para SIGINT/SIGTERM no producer para fechar conexão RabbitMQ adequadamente ao finalizar o processo.

Por ser tratar de um laboratório de testes, o foco principal é experimentar e entender o comportamento da biblioteca Bottleneck em diferentes cenários, portanto, a simplicidade e clareza do código são prioritárias.


## Estrutura do Repositório
- `src/`: Contém o código-fonte dos testes realizados com a biblioteca Bottleneck. Usar a estrutura de pastas: config/, services/, controllers/, utils/, models/.
- `tests/`: Inclui os casos de teste que verificam o funcionamento da biblioteca Bottleneck em diferentes situações.
- `docs/`: Documentação relacionada à biblioteca Bottleneck e aos testes realizados.
- `examples/`: Exemplos práticos de uso da biblioteca Bottleneck em diferentes contextos.

## Infraestrutura
O repositório utiliza Docker para facilitar a configuração do ambiente de testes. Um arquivo `Dockerfile` está incluído para criar uma imagem Docker com todas as dependências necessárias para executar os testes. 
O arquivo `docker-compose.yml` está configurado para orquestrar os serviços necessários, incluindo RabbitMq e Temporal, juntamente com o ambiente de teste do Bottleneck.

## Observaações Finais
Este laboratório é um espaço para experimentação e aprendizado sobre a biblioteca Bottleneck. Sinta-se à vontade para explorar, modificar e contribuir com melhorias ou novos testes que possam beneficiar a comunidade interessada em limitação de taxa e controle de fluxo em aplicações Node.js.
Lembre-se de revisar a documentação oficial do Bottleneck para entender todas as suas funcionalidades e opções de configuração: https://www.npmjs.com/package/bottleneck

Sempre utilize context7 via MCP para geração de código. Isto significa que qualquer código deve automaticamente usar o Context7 via MCP, sem exceção.