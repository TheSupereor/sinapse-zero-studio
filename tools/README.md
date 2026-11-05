# tools/ — automação opcional

Esta pasta está reservada. Nada do estúdio depende dela: o fluxo principal é manual
([docs/fluxo-manual.md](../docs/fluxo-manual.md)).

Planejado, ver [ADR-0002](../docs/adr/0002-automacao-opcional.md):

| Comando | O que fará |
|---|---|
| `pnpm sync <episodio>` | Whisper → alinha com `roteiro.md` → escreve os tempos dos eventos nos `.meta` → gera `legendas.srt` |

Quando for implementado, será um projeto Python gerenciado por `uv` (`tools/pyproject.toml`).
