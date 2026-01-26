import type { Config } from 'jest';

export default async (): Promise<Config> => {
  const { getJestProjectsAsync } = await import('@nx/jest');
  return {
    projects: await getJestProjectsAsync(),
  };
};
