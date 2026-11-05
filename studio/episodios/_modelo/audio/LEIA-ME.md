# Áudio do episódio

| Arquivo | O que é | Versionar? |
|---|---|---|
| `narracao.wav` | Narração final, já limpa. É a trilha que aparece na linha do tempo. | Sim |
| `sfx/*.wav` | Efeitos sonoros (whoosh, clique, bip do SYS//A) | Sim |
| `brutos/` | Takes e projetos do Audacity (`.aup3`) | Não (está no `.gitignore`) |

## Exportar do Audacity

1. Edite os takes em `brutos/` e normalize para −1 dB. Se precisar, use Efeito › Redução de ruído.
2. Exporte com **Arquivo › Exportar áudio**: WAV, PCM 16 bits, 48000 Hz, mono, com o nome `narracao.wav`.
3. No arquivo de projeto do episódio (`<id>.ts`), descomente `import narracao ...` e `audio: narracao`.

O editor recarrega sozinho. Se você reexportar a narração com o editor aberto, ele também atualiza.

## Efeitos sonoros numa cena

```tsx
import {sound} from '@canvas-commons/core';
import clique from '../audio/sfx/clique.wav';

yield* waitUntil('liga');
sound(clique).gain(-6).play();
```

Os efeitos entram no MP4 exportado junto com a narração.
