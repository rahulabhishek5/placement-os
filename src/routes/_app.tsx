import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HydrationGate } from "@/components/hydration-gate";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { auth } = Route.useRouteContext();

  return (
    <AppShell user={auth.user}>
      <HydrationGate
        fallback={<div className="min-h-[50vh] rounded-xl border border-hairline bg-surface/60" />}
      >
        <Outlet />
      </HydrationGate>
    </AppShell>
  );
}
