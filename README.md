# Capital Gains – Code Challenge (JavaScript/Node.js)

Este repositório implementa o desafio de **cálculo de imposto sobre ganho de capital** com entrada via **stdin** e saída via **stdout**, seguindo as regras e o formato descritos no enunciado.

---

## ✨ Contexto do Desafio

- A aplicação lê **uma ou mais listas JSON por linha** a partir de `stdin`. Cada **lista** representa **uma simulação independente**.
- Para cada operação na lista, deve-se imprimir **na saída padrão** uma **lista JSON** de mesmo tamanho contendo objetos `{ "tax": number }`.
- O programa **encerra** ao receber **uma linha vazia** (quando em modo interativo) ou no **EOF** (quando usando pipe/arquivo).

### Regras de Negócio (resumo)
- **Compras (`buy`)**: não há imposto e **atualizam o preço médio ponderado** da carteira.
- **Vendas (`sell`)**: podem gerar imposto.
  - Calcular **lucro bruto**: `(preço de venda - preço médio) × quantidade vendida`.
  - **Prejuízos**: se o lucro bruto for **≤ 0**, **não há imposto** e o prejuízo é **acumulado** para compensações futuras.
  - **Isenção por operação**: se o **valor total da venda** (preço × quantidade) for **≤ 20.000,00**, **não há imposto**, e **lucros** nesse caso **não consomem** o prejuízo acumulado.
  - **Operação tributável** (> 20.000,00): o **prejuízo acumulado** é **consumido** para reduzir o lucro, e o que sobrar é tributado a **20%**.
- **Preço médio ponderado** só muda em **compras**; **vendas** não alteram a média.
- Não há vendas acima do estoque (o enunciado assume entradas válidas dessa natureza).

### Formato numérico
- Todos os cálculos internos são feitos em **centavos (inteiros)** para evitar erros de ponto flutuante.
- A saída imprime `number` com **duas casas decimais** quando necessário (JSON permite remover zeros à direita).

---

## ▶️ Como Rodar

### Pré-requisitos

#### Para execução local:
- **Node.js 18+** (funciona também em 20/22)

#### Para execução com Docker:
- **Docker** e **Docker Compose** instalados
- **Nenhuma instalação de Node.js necessária!**

### Instalação

#### Opção 1: Com Node.js Local
```bash
npm i
```

#### Opção 2: Com Docker (Sem instalação do Node.js)
Apenas certifique-se de ter Docker instalado. **Nenhuma instalação de Node.js necessária!**

### Execução (CLI)

#### Com Node.js Local
Rode a aplicação e forneça uma linha com uma **lista JSON** de operações (`buy`/`sell`):

```bash
npm start
# cole uma linha JSON e tecle Enter
# tecle Enter novamente numa linha vazia para encerrar
```

#### Com Docker
**Modo Interativo**:
```bash
docker-compose run --rm code-challenge
# cole uma linha JSON e tecle Enter
# tecle Enter novamente numa linha vazia para encerrar
```

**Ou construa e execute diretamente**:
```bash
docker build -t code-challenge .
docker run -it --rm code-challenge
```

#### Exemplos rápidos

##### Com Node.js Local:
- **Com pipe** (campos oficiais `unit-cost`):
```bash
echo '[{"operation":"buy","unit-cost":10.00,"quantity":100},{"operation":"sell","unit-cost":12.00,"quantity":50}]' | npm start
```
- **Aceita também `unitCost`**:
```bash
echo '[{"operation":"buy","unitCost":10,"quantity":100},{"operation":"sell","unitCost":12,"quantity":50}]' | npm start
```
- **Lendo de arquivo**:
```bash
npm start < input.txt
```

##### Com Docker:
- **Com pipe**:
```bash
echo '[{"operation":"buy","unit-cost":10.00,"quantity":100},{"operation":"sell","unit-cost":12.00,"quantity":50}]' | docker-compose run --rm code-challenge
```
- **Lendo de arquivo**:
```bash
docker-compose run --rm code-challenge < input.txt
```

> **Nota**: Onde `input.txt` contém uma ou mais linhas, cada uma com uma lista JSON de operações.

#### Várias simulações na mesma linha
- **Arrays colados** (funciona em ambas as versões):
```bash
echo '[{"operation":"buy","unit-cost":10,"quantity":100}][{"operation":"sell","unit-cost":15,"quantity":100}]' | npm start
# ou com Docker:
echo '[{"operation":"buy","unit-cost":10,"quantity":100}][{"operation":"sell","unit-cost":15,"quantity":100}]' | docker-compose run --rm code-challenge
# o programa emitirá DUAS linhas de saída (uma por lista)
```

---

## ✅ Regras & Critérios de Aceite

1. **Entrada/saída**
   - Lê de **stdin** e imprime **apenas** listas JSON válidas em **stdout**, **uma por lista** de entrada.
   - **Uma simulação por lista**: o estado **não se carrega** entre listas de **linhas diferentes** (ou arrays colados).
   - Encerramento por **linha vazia** (interativo) ou **EOF** (pipe/arquivo).

2. **Cálculo de imposto**
   - **20%** sobre o **lucro tributável** de **vendas**.
   - **Preço médio** atualizado **apenas** em **compras** (média ponderada, arredondada para centavos).
   - **Prejuízo acumulado**: sempre acumula quando a venda gera prejuízo; é **consumido** somente em **operações tributáveis** (> 20k).
   - **Isenção por operação ≤ 20.000,00**: não há imposto; **lucros isentos não consomem** prejuízo; **prejuízos isentos** continuam acumulando.

3. **Formatação e precisão**
   - Cálculos internos em **centavos**; saída numérica compatível com JSON.
   - Arredondamento de média e imposto para **2 casas decimais**.

4. **Qualidade e testes**
   - **Testes unitários** e **E2E** com **Jest**.
   - Relatório de **coverage** disponível.

> **Aceite**: O desafio é considerado pronto quando os **casos de teste E2E** (baseados no enunciado) passam, e os **testes unitários** de domínio cobrem as regras-chave com cobertura adequada.

---

## 🧪 Testes

### Com Node.js Local

#### Rodar todos os testes (unit + e2e)
```bash
npm test
```

#### Apenas unitários
```bash
npm run test:unit
```

#### Apenas E2E (simulando o CLI)
```bash
npm run test:e2e
```

#### Coverage
```bash
npm run test:coverage
# relatório em texto + lcov (para CI/Codecov)
```

### Com Docker

#### Rodar todos os testes
```bash
docker-compose --profile test run --rm code-challenge-test
```

#### Ou construa e execute diretamente
```bash
docker build -f Dockerfile.test -t code-challenge-test .
docker run --rm code-challenge-test npm test
```

#### Para coverage com Docker
```bash
docker run --rm code-challenge-test npm run test:coverage
```

Os testes E2E comparam a saída do CLI contra os valores esperados dos **casos do enunciado** (inclui cenários com isenção, compensação de prejuízo, atualização de média, etc.).

---

## 🏗️ Arquitetura & Estrutura

A solução segue um **Monólito Modular** com **Arquitetura Hexagonal (Ports & Adapters)**:

- **domain/** (puro): regras de negócio e cálculos, sem dependências de infra
  - `money.js` — helpers monetários (centavos/inteiros, arredondamento, média ponderada)
  - `portfolio/PortfolioState.js` — estado (quantidade, preço médio, prejuízo)
  - `tax/TaxCalculator.js` — orquestra a política de imposto
  - `tax/policies/BrazilEquities20pct.js` — regra atual (isenção ≤ 20k, 20%, consumo de prejuízo)
  - `operations.js` — parser/validação de operações de entrada
- **application/**: caso de uso que orquestra domínio e portas
  - `process-line.usecase.js` — lê linhas, processa listas, escreve saída
- **ports/**: contratos para entrada/saída/log (`LineReaderPort`, `LineWriterPort`, `LoggerPort`)
- **adapters/**: implementações concretas de portas
  - `adapters/cli/StdinLineReader.js` — leitura via `readline`
  - `adapters/cli/StdoutLineWriter.js` — escrita `JSON.stringify`
  - `adapters/logging/ConsoleLogger.js` — logging básico
- **index/app**: bootstrap/wire-up

### Regras de dependência
- `domain` **não** depende de `application`/`adapters`.
- `application` depende de `domain` e dos contratos em `ports`.
- `adapters` implementam `ports` e são injetados no `app.js`.

### Por que é bom para escalar/manter
- Trocar CLI por **HTTP/filas**: adiciona-se novos adapters, **sem** tocar no domínio.
- Mudar a regra fiscal (outro país, taxa, limites): nova **Policy** plugável.
- Fácil de testar: domínio puro com unit, camada de aplicação com dublês, E2E via CLI.

### Decisões-chave
- **Centavos/inteiros** para precisão financeira.
- **Arredondamento** somente onde necessário (média, imposto).
- **Sem** dependência externa em runtime; apenas **Jest** em dev/test.

---

## 📁 Estrutura de Pastas (resumo)

```
code-challenge/
├─ package.json
├─ jest.config.js
├─ src/
│  ├─ index.js
│  ├─ app.js
│  ├─ application/
│  │  └─ process-line.usecase.js
│  ├─ domain/
│  │  ├─ money.js
│  │  ├─ operations.js
│  │  ├─ portfolio/
│  │  │  └─ PortfolioState.js
│  │  └─ tax/
│  │     ├─ TaxCalculator.js
│  │     └─ policies/
│  │        └─ BrazilEquities20pct.js
│  ├─ ports/
│  │  ├─ LineReaderPort.js
│  │  ├─ LineWriterPort.js
│  │  └─ LoggerPort.js
│  └─ adapters/
│     ├─ cli/
│     │  ├─ StdinLineReader.js
│     │  └─ StdoutLineWriter.js
│     └─ logging/
│        └─ ConsoleLogger.js
└─ tests/
   ├─ unit/
   │  ├─ money.test.js
   │  ├─ policy.test.js
   │  └─ portfolio.test.js
   └─ e2e/
      └─ cli.e2e.test.js
```

---

## 🔧 Scripts
```json
{
  "start": "node ./src/index.js",
  "test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand",
  "test:unit": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js __tests__/unit --runInBand",
  "test:e2e": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js __tests__/e2e --runInBand",
  "test:coverage": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand --coverage",
  "test:coverage:e2e": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js __tests__/e2e --runInBand --coverage",
  "test:coverage:unit": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js __tests__/unit --runInBand --coverage",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "quality": "npm run lint && npm run format:check && npm test"
}
```

---

## ℹ️ Observações & Limitações
- O parser aceita **`unit-cost`** (oficial) e **`unitCost`** (qualidade de vida). Se desejar, pode-se ativar um **modo estrito** aceitando **apenas** `unit-cost`.
- A aplicação também lida com **múltiplos arrays colados** na mesma linha (ex.: `][`). Isso não é obrigatório, mas melhora a robustez do CLI.
- O enunciado assume entradas válidas quanto a não vender acima do estoque; o domínio tem uma checagem defensiva para esse caso.

---

