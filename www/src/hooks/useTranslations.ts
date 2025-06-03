// This hook's functionality has been integrated directly into useAppContext
// in contexts/AppContext.tsx for simplicity and to avoid circular dependencies
// or needing to pass 't' function separately.

// You can directly use:
// import { useAppContext } from '../contexts/AppContext';
// const { t } = useAppContext();

// This file can be removed if not used for other purposes.
// For the purpose of this refactoring, we will assume it's effectively merged.
// If you prefer a separate hook, it would look like this:

/*
import { useAppContext } from '../contexts/AppContext';

export const useTranslations = () => {
  const { t } = useAppContext();
  return { t };
};
*/
// However, to keep changes minimal and direct, components will use useAppContext.
export {}; // Placeholder to make this a module if kept empty.