"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

const TenantFilterContext = createContext({
  filterVersion: 0,
  bumpFilterVersion: () => {},
});

export function TenantFilterProvider({ children }) {
  const [filterVersion, setFilterVersion] = useState(0);

  const bumpFilterVersion = useCallback(() => {
    setFilterVersion((v) => v + 1);
  }, []);

  return (
    <TenantFilterContext.Provider value={{ filterVersion, bumpFilterVersion }}>
      {children}
    </TenantFilterContext.Provider>
  );
}

export function useTenantFilterVersion() {
  return useContext(TenantFilterContext).filterVersion;
}

export function useTenantFilterActions() {
  const { bumpFilterVersion } = useContext(TenantFilterContext);
  return { bumpFilterVersion };
}
