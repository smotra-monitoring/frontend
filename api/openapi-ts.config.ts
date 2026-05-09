import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './api/openapi/api/spec.yaml', // sign up at app.heyapi.dev
    output: {
        format: 'prettier',
        lint: 'eslint',
        path: 'src/api', // generated code output directory
    },
    plugins: [
        '@hey-api/schemas',
        {
            dates: true,
            name: '@hey-api/transformers',
        },
        {
            enums: 'javascript',
            name: '@hey-api/typescript',
        },
        {
            name: '@hey-api/sdk',
            transformer: true,
        },
    ],
});