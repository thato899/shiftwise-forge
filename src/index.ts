import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getDashboard', async () => ({
  product: 'Shiftwise',
  mode: 'synthetic-demo',
  staffing: {
    post: 'Engine maintenance',
    minimum: 3,
    assignedQualified: 4,
    critical: true,
  },
  nextStep: 'Coverage rules and leave evaluation are being built.',
}));

export const handler = resolver.getDefinitions();
