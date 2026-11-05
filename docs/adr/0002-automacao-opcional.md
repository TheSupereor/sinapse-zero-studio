# ADR-0002 — Manual primeiro; automação como opção

**Data:** 2026-11-05 · **Status:** aceito

## Contexto

O usuário quer editar tudo à mão no editor do Canvas Commons e ter a automação, como a sincronia por
Whisper, apenas como opção.

## Decisão

1. **O fluxo manual é o caminho principal** ([fluxo-manual.md](../fluxo-manual.md)). Nenhuma cena, componente ou template pode depender de um script de automação.
2. **Fonte da verdade:** a automação, quando existir, escreve **nos mesmos arquivos que o editor usa**: o `timeEvents[].targetTime` no `.meta` de cada cena. Não há um segundo formato de tempos. Rodar a automação e depois arrastar à mão continua funcionando; o último a escrever vence.
3. **Onde mora:** os scripts opcionais ficam em `tools/` (Python, gerenciado por `uv`) e são chamados por comandos `pnpm` próprios. Instalar ou não o `tools/` não afeta o `pnpm dev`.

## Fatos verificados no spike (Canvas Commons 0.4.0)

**`.meta` de cena:**

```json
{"version": 0, "timeEvents": [{"name": "fim", "targetTime": 0.6}], "seed": 3672189177}
```

- O `targetTime` é **relativo ao início da cena**. Com um `aparecer()` de 0,6 s antes do `waitUntil('fim')`, o editor registrou 0,6.
- Mudar o `targetTime` de 0,6 para 3,0 aumentou o vídeo exportado em exatos 2,4 s.

**Exportação:** o exportador WebCodecs mixa o `audio` do projeto e os `sound()` no MP4 (AAC, 48 kHz).

## Automação planejada (ainda não implementada)

`pnpm sync <episodio>` fará:
1. transcrever `audio/narracao.wav` com faster-whisper (pt-BR, timestamps por palavra);
2. alinhar com o texto do `roteiro.md` (difflib, com o texto normalizado);
3. converter cada `[evento]` num tempo relativo ao início da sua `## cena:`;
4. escrever o resultado nos `.meta`;
5. gerar `legendas.srt` com a grafia do roteiro.

Nota de implementação: no faster-whisper 1.2.1 com o PyAV mais recente, a decodificação de áudio
quebra (`av.open(metadata_errors=...)`). Decodifique com ffmpeg (`imageio-ffmpeg`) e passe um array numpy.
