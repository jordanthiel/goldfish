import React, { createContext, useContext, useMemo, useState } from 'react';

export type InternalPageMeta = {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  /** Override main content padding / layout (e.g. full-height playground). */
  contentClassName?: string;
  /** Use full viewport height with no outer scroll (playground). */
  fullHeight?: boolean;
};

type InternalLayoutContextValue = {
  pageMeta: InternalPageMeta;
  setPageMeta: React.Dispatch<React.SetStateAction<InternalPageMeta>>;
};

const InternalLayoutContext = createContext<InternalLayoutContextValue | null>(null);

export function InternalLayoutProvider({ children }: { children: React.ReactNode }) {
  const [pageMeta, setPageMeta] = useState<InternalPageMeta>({});

  const value = useMemo(
    () => ({ pageMeta, setPageMeta }),
    [pageMeta],
  );

  return (
    <InternalLayoutContext.Provider value={value}>
      {children}
    </InternalLayoutContext.Provider>
  );
}

export function useInternalLayoutContext() {
  const ctx = useContext(InternalLayoutContext);
  if (!ctx) {
    throw new Error('useInternalLayoutContext must be used within InternalLayout');
  }
  return ctx;
}

/** Set page title, description, and optional header actions for the current internal route. */
export function useInternalPageHeader(
  meta: InternalPageMeta,
  deps: React.DependencyList = [],
) {
  const { setPageMeta } = useInternalLayoutContext();

  React.useEffect(() => {
    setPageMeta(meta);
    return () => setPageMeta({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setPageMeta,
    meta.title,
    meta.description,
    meta.contentClassName,
    meta.fullHeight,
    ...deps,
  ]);
}
