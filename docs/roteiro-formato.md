# Formato do roteiro (`roteiro.md`)

O roteiro é um markdown no formato A/V (áudio/visual) que fica dentro da pasta do episódio. Ele serve
a você na gravação e na sincronia manual e, no futuro, à automação opcional. Por isso segue regras simples.

```markdown
---
codigo: BT-01
titulo: LED
retoma: [BT-00]
tema: blueprint
---

# BT-01 — LED

## cena: 01-situacao

> visual: bancada vazia; estagiário (fora de quadro) conecta o LED direto na bateria de 9 V.

[liga] O estagiário conectou o LED direto na bateria.
[queima] Por cerca de um décimo de segundo, funcionou.

> visual: SYS//A aparece embaixo.

[sys] Componente danificado.

## cena: 02-abertura

[abertura-sai]
```

## Regras

| Elemento | Significado |
|---|---|
| `## cena: <nome>` | Começa uma cena. O nome é o do arquivo em `cenas/`, sem `.tsx`. |
| Linha de texto comum | Narração, exatamente como você vai falar. |
| `> visual: ...` | Nota de tela: o que aparece. Não é falado. |
| `[evento]` | Ponto de sincronia. O mesmo nome vai num `waitUntil('evento')` daquela cena. Fica **antes** da palavra em que a animação começa. |

## Por que os marcadores ficam no texto

- **No fluxo manual:** ao arrastar a pílula `liga` no editor, você sabe exatamente para qual palavra ela vai.
- **Na automação futura:** a sincronização por Whisper vai alinhar estas palavras ao áudio e escrever os tempos nos mesmos `.meta` que o editor usa. Você continua podendo corrigir à mão depois. Ver [ADR-0002](adr/0002-automacao-opcional.md).
