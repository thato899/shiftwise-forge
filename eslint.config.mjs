import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Type-aware checks are handled by the separate TypeScript compiler step.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
