import { defineConfig } from '@hey-api/openapi-ts';

const shouldWatch =
  process.argv.includes('--watch') || process.env.OPENAPI_WATCH === '1';

export default defineConfig({
  input: {
    path: 'http://localhost:5500/openapi.json',
    watch: shouldWatch,
  },
  output: {
    path: 'lib/api/generated',
    format: 'prettier',
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      client: '@hey-api/client-axios',
    },
    '@tanstack/react-query',
  ],
});
