# Fluxo manual: do áudio ao MP4, tudo no editor

Este é o fluxo principal do estúdio. Nada aqui depende de automação: você grava, ajusta o tempo
arrastando eventos no editor do Canvas Commons e exporta o MP4. Os scripts de automação
(sincronização por Whisper e outros) entram depois, como **opção**, e escrevem nos mesmos arquivos que
o editor usa. Ver [ADR-0002](adr/0002-automacao-opcional.md).

## 0. Abrir o editor

```powershell
cd C:\Users\Synapticon\Documents\Estudos\synapticon-studio
pnpm dev
```

Abra **http://localhost:9000** no Vivaldi. A página inicial lista os projetos:

| Projeto | Endereço |
|---|---|
| Mostruário escuro | `/mostruario/blueprint` |
| Mostruário claro | `/mostruario/laboratorio` |
| Modelo de episódio | `/episodios/_modelo/_modelo` |
| Seus episódios | `/episodios/<id>/<id>` |

## 1. Criar o episódio

```powershell
pnpm novo bt-01-led
```

O comando copia `studio/episodios/_modelo` para `studio/episodios/bt-01-led`, renomeia o arquivo de
projeto para `bt-01-led.ts` e troca `BT-XX` por `BT-01`. **Reinicie o `pnpm dev`** (Ctrl+C e rode de
novo) para o editor enxergar o projeto novo.

```
studio/episodios/bt-01-led/
├─ bt-01-led.ts      ← o projeto: lista de cenas, áudio e tema
├─ bt-01-led.meta    ← configurações do editor (exportador, fps…), gravadas por ele
├─ roteiro.md        ← roteiro A/V (narração + notas de tela + marcadores)
├─ cenas/            ← uma cena por arquivo .tsx, cada uma com o seu .meta
├─ audio/            ← narracao.wav, sfx/, brutos/ (ignorado pelo git)
└─ imagens/          ← prints, fotos, datasheets
```

## 2. Gravar e ligar a narração

1. Grave e exporte do Audacity. O passo a passo está em `audio/LEIA-ME.md`: WAV, 48 kHz, mono, nome `narracao.wav`.
2. Em `bt-01-led.ts`, descomente estas duas linhas:

   ```ts
   import narracao from './audio/narracao.wav';
   // ...
   audio: narracao,
   ```

A onda da narração aparece na linha do tempo. Use o botão de som do player para ouvir. Se o áudio
precisar começar antes ou depois, ajuste o **audio offset** em *Video Settings*, ou arraste a faixa
de áudio segurando Shift.

## 3. Sincronizar à mão com eventos

O que dá ritmo ao vídeo são os **eventos de tempo**. No código da cena:

```tsx
yield* waitUntil('liga');   // ← vira uma pílula "liga" na linha do tempo
yield* chave().fechar();
```

No editor:

1. Dê play e ache, na onda, a palavra em que a animação deve começar.
2. **Arraste a pílula `liga`** até esse ponto.
3. O editor grava a posição em `cenas/<cena>.meta`. Versione esses arquivos: eles guardam o seu trabalho de sincronia.

Detalhes que ajudam:

- **Tempo relativo:** o `targetTime` no `.meta` é contado a partir do início da cena, então mexer numa cena não desloca os eventos das outras.
- **Eventos atrasados:** se o evento fica *antes* do fim da animação anterior, ele não espera nada e a animação seguinte começa atrasada em relação à fala. Arraste a pílula para depois, ou encurte a animação anterior.
- **Cada bloco espera o seu evento.** Os blocos prontos (`abertura`, `capitulo`, `retomada`, `encerramento`) entram sozinhos e esperam `abertura-sai`, `capitulo-sai`… para sair.
- **Duração controlada pelo editor.** Use `useDuration`; a pílula fica com uma "barra" que você estica:

  ```tsx
  yield* grafico().curva(f).end(1, useDuration('desenha-curva'));
  ```

- **Efeitos sonoros** saem no ponto exato da cena:

  ```tsx
  yield* waitUntil('queima');
  sound(estalo).play();
  yield* led().queimar();
  ```

## 4. Ajustar o visual

Salve o `.tsx` e o editor recarrega na hora (hot reload).

- **Peças prontas:** a referência dos componentes está em [componentes.md](componentes.md), e o mostruário em `studio/mostruario/cenas/` tem um exemplo de cada um.
- **Cores e tema:** use sempre as do tema (`useTema().destaque`), nunca hex direto. Assim, trocar `tema: 'laboratorio'` no projeto muda o episódio inteiro.
- **Sem código:** você também pode posicionar e animar nós "na mão", direto nas cenas, com a API do Canvas Commons: `no().position([x, y], 0.6)`, `no().opacity(0, 0.3)` etc. Os componentes são só atalhos.

## 5. Exportar

Em *Video Settings* (ícone de câmera, à esquerda):

- **exporter:** *Video (WebCodecs)*, que já vem como padrão nos episódios. Ele gera MP4 H.264 com a narração e os efeitos sonoros mixados.
- **range:** exporta só um trecho, útil para revisar uma cena.
- **RENDER:** o arquivo sai em `studio/output/<id>.mp4`.

Para editar no DaVinci depois, troque o exporter para *Image sequence*: ele gera PNGs em `studio/output/<id>/`.
