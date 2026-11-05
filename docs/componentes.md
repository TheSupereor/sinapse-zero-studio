# Componentes — referência rápida

Importe tudo de `@synapticon/components` e os tokens de `@synapticon/brand`. Cada componente tem
um exemplo funcionando em `studio/mostruario/cenas/`.

O padrão é sempre o mesmo:
1. o componente nasce **parado ou invisível**;
2. um método gerador (`*mostrar`, `*dizer`, `*plotar`…) o anima;
3. você chama o método depois de um `waitUntil('evento')`.

Todo método aceita a duração como último argumento.

## Base visual

| Componente | Para quê | Métodos principais |
|---|---|---|
| `Fundo` | Fundo do tema + grade de prancheta | `revelar()` |
| `Callout` | Rótulo com linha-guia até um ponto (`alvo` pode ser função) | `mostrar()`, `esconder()` |
| `Grifo` | Marca-texto que varre um trecho (posição = borda esquerda) | `varrer()`, `apagar()` |
| `Moldura` | Caixa de contorno que se desenha | `desenhar()`, `apagar()` |
| `Anunciador` | Terminal **SYS//A**: digita texto com cursor | `aparecer()`, `dizer(t)`, `continuar(t)`, `limpar()`, `sumir()` |
| `Cartao` | Número grande + rótulo + legenda ("2,0 V") | `contar(de, ate, dur, formato)` |
| `Grafico` | Eixos, curva que se desenha, marcas com guias | `revelar()`, `plotar(f)`, `curva(f)`, `marcar(x, y)`, `ponto(x, y)` |
| `PrintZoom` | Print com zoom e grifo (regiões em px da imagem) | `focar(regiao \| null)`, `grifar(regiao)` |
| `Marca` | Logo discreto num canto | — |
| `Icone` | Pictograma do kit, recolorido (`nome`: bateria, tensao, solda…) | — |

## Eletrônica

Os símbolos seguem IEC/ABNT, são horizontais e têm os pinos em x = ±80. Gire com `rotation={90}`.
`pino('nome')` devolve a posição do pino no espaço do pai, então fios e símbolos devem ter o
**mesmo pai**.

| Símbolo | Pinos | Extras |
|---|---|---|
| `Resistor` | `a`, `b` | `estilo: 'iec' \| 'ansi'` |
| `Diodo` | `a` (anodo), `k` (catodo) | |
| `LED` | `a`, `k` | signal `brilho` (0–1); `acender()`, `apagar()`, `queimar()` |
| `Capacitor` | `a`, `b` | |
| `Bateria` | `pos`, `neg` | placa longa = + |
| `Terra` | `t` | |
| `Chave` | `a`, `b` | signal `fechada` (0–1); `fechar()`, `abrir()` |

`Fio` é uma linha com **pontos de corrente que andam sozinhos**, no sentido do primeiro para o último ponto.
- **Ligar e desligar:** `ligar()` e `desligar()` animam o signal `corrente` (0–1).
- **Velocidade:** `velocidade` em px/s; um valor negativo inverte o sentido.
- **Controle manual:** defina `fase` para mover os pontos você mesmo.

```tsx
<Fio points={() => [bat().pino('pos'), [bat().pino('pos').x, -250], chave().pino('a')]} />
```

`Osciloscopio` mostra uma tela com uma onda que rola sozinha. As ondas prontas estão em `ondas`: `senoide`, `quadrada`, `continua` e `meiaOnda`. O signal `ganho` (0–1) "liga" o sinal.

## Blocos de estrutura (templates)

São funções geradoras que você chama dentro de qualquer cena: `yield* capitulo(view, {...})`.

| Bloco | Evento de saída | Opções |
|---|---|---|
| `abertura` | `abertura-sai` | `codigo`, `titulo`, `sobretitulo?` |
| `capitulo` | `capitulo-sai` | `numero`, `titulo`, `subtitulo?` |
| `retomada` | `retomada-sai` | `codigo`, `titulo`, `lembrete` |
| `encerramento` | `encerramento-sai` | `codigo`, `proximo?`, `falas?` |

Para usar o mesmo bloco duas vezes na mesma cena, passe `evento: 'outro-nome'`.

## Ritmo

- `ritmo.rapido`, `ritmo.normal` e `ritmo.lento` valem 0,3, 0,6 e 1,2 s. Use-os em vez de números soltos.
- `curvas.entrada`, `curvas.saida` e `curvas.suave` são os easings com nome.
- `aparecer(no)` faz o nó surgir com fade e uma leve subida; `sumir(no)` o faz sumir com fade.

## Tema

- `useTema()` devolve os papéis de cor: `fundo`, `grade`, `painel`, `filete`, `tinta`, `suave`, `apagado`, `destaque`, `ciano`, `ambar` e `vermelho`.
- O projeto escolhe o tema com `variables: {tema: 'blueprint' | 'laboratorio'}`.
- As fontes estão em `fontes.display`, `fontes.corpo` e `fontes.mono` (Bahnschrift, Segoe UI e Consolas, todas do sistema).
- Os tamanhos estão em `tamanhos.*`.
