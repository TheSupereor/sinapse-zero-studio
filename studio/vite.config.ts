import canvasCommons from '@canvas-commons/vite-plugin';
import webcodecs from '@canvas-commons/webcodecs';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [
    canvasCommons({
      // Every file matched here is a project in the editor (localhost:9000).
      // The file name becomes the exported file name:
      //   episodes/bt-01-led/bt-01-led.ts → output/bt-01-led.mp4
      // so every project file needs a unique name.
      project: [
        './showcase/*.ts', // component gallery, in both themes
        './presets/*.ts', // standalone transitions, rendered for a video editor
        './template/*.ts', // the episode skeleton copied by `pnpm new`
        './episodes/*/*.ts', // your episodes (git-ignored, see .gitignore)
      ],
    }),
    // Exports MP4 straight from the editor, with narration and sound effects mixed in.
    webcodecs(),
  ],
});
