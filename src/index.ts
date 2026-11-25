import Resolver from '@forge/resolver';
import { evaluateCoverage } from './domain/coverage';
import { engineMaintenanceFixture } from './domain/coverage.fixtures';

const resolver = new Resolver();

resolver.define('getDashboard', async () => {
  const evaluation = evaluateCoverage(engineMaintenanceFixture);
  return {
    product: 'Shiftwise',
    mode: 'synthetic-demo',
    staffing: {
      post: evaluation.posts[0].name,
      minimum: evaluation.posts[0].minimum,
      assignedQualified: evaluation.posts[0].assignedWorkerIds.length,
      deficit: evaluation.posts[0].deficit,
      critical: evaluation.posts[0].critical,
      feasible: evaluation.feasible,
    },
    nextStep: 'Coverage evaluation is active for synthetic data. Leave decisions and overtime assignment are not yet enabled.',
  };
});

export const handler = resolver.getDefinitions();
