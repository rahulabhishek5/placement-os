import { useEffect, useState, type ReactNode } from "react";

export function HydrationGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
