import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Heading, Text, Stack, SectionMessage, Strong, Spinner } from '@forge/react';
import { invoke } from '@forge/bridge';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    invoke('getDashboard')
      .then(setDashboard)
      .catch(() => setError('Could not load the Shiftwise demo. Refresh or contact your Jira administrator.'));
  }, []);

  if (error) return <SectionMessage appearance="error"><Text>{error}</Text></SectionMessage>;
  if (!dashboard) return <Spinner />;

  return (
    <Stack space="space.200">
      <Heading as="h1">Shiftwise</Heading>
      <Text>Coverage-aware shifts, leave decisions, and voluntary overtime.</Text>
      <SectionMessage appearance="warning">
        <Text><Strong>Synthetic demo only.</Strong> No live employee records are used. Leave decisions and overtime assignment are not yet enabled.</Text>
      </SectionMessage>
      <Heading as="h2">{dashboard.staffing.post}</Heading>
      <Text>Minimum per shift: {dashboard.staffing.minimum} qualified people</Text>
      <Text>Currently assigned: {dashboard.staffing.assignedQualified} qualified people</Text>
      <Text>Critical post: {dashboard.staffing.critical ? 'Yes' : 'No'}</Text>
      <Text>{dashboard.nextStep}</Text>
    </Stack>
  );
}

ForgeReconciler.render(<App />);
