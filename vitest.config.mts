import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['test/**/*.test.{ts,tsx}'], environment: 'happy-dom', server: { deps: { inline: [/@superset-ui/] } } },
});
