import { createFileRoute, redirect } from "@tanstack/react-router";

// Profile has been merged into /settings.
// This redirect ensures any bookmarked /profile links still work.
export const Route = createFileRoute("/_app/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/settings" });
  },
  component: () => null,
});
