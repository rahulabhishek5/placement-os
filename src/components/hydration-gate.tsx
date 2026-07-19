import { useEffect, useState, type ReactNode } from "react";

// Module-level flag: once the client has hydrated once, it never needs
// to gate again. This prevents the blank-frame flash on every navigation.
let isHydrated = false;

export function HydrationGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      isHydrated = true;
      setHydrated(true);
    }
  }, []);

  if (!hydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
