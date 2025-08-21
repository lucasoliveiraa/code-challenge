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
