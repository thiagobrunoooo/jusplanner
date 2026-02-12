// Barrel export — backwards compatible
// Individual hooks have been split into separate files for better maintainability.
// This file re-exports them all so existing imports continue to work.

export { useProfileData } from './useProfileData';
export { useDailyHistory } from './useDailyHistory';
export { useProgressData } from './useProgressData';
export { useStudyTime } from './useStudyTime';
export { useNotes } from './useNotes';
export { useMaterials } from './useMaterials';
export { useSubjects } from './useSubjectsData';
