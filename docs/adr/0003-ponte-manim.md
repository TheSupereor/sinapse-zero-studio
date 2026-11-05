# ADR-0003 — Manim fica para depois, como ponte de vídeo

**Data:** 2026-11-05 · **Status:** adiado (estrutura reservada)

## Contexto

O Canvas Commons já cobre a maior parte do que os BTs precisam: LaTeX (MathJax), gráficos, morphing
de curvas e código. O Manim é mais forte em 3D e em matemática animada pesada, como campos,
bobinas e transformações de equações.

## Decisão

Não integrar agora. Quando surgir uma cena que precise do Manim:

1. **Projeto Python:** criar um projeto em `manim/`, gerenciado por `uv`, com uma cena por arquivo.
2. **Renderizar em WebM com alfa:** `manim render -qh --transparent --format webm cena.py Classe`. O resultado vai para `studio/episodios/<id>/manim/`.
3. **Componente `ManimClip`:** um `Video` do Canvas Commons com `play()` sincronizado a um `waitUntil`.

## Consequências

- As equações no Manim exigem LaTeX instalado (MiKTeX). Use o `Latex` do Canvas Commons enquanto der.
- O clipe Manim é um vídeo pronto, não um nó editável. Ajustes de tempo internos são feitos no Python.
