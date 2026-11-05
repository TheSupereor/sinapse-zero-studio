import canvasCommons from '@canvas-commons/vite-plugin';
import webcodecs from '@canvas-commons/webcodecs';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [
    canvasCommons({
      // Cada arquivo .ts na raiz de um episódio é um projeto no editor (localhost:9000).
      // O nome do arquivo vira o nome do MP4 exportado: episodios/bt-01-led/bt-01-led.ts
      // → output/bt-01-led.mp4. Por isso cada projeto tem um nome único.
      project: [
        './mostruario/*.ts',
        './episodios/*/*.ts',
      ],
    }),
    // Exporta MP4 direto do editor, já com a narração e os efeitos sonoros.
    webcodecs(),
  ],
});
