import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Check, Terminal, LineChart, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    // Redirect already-authenticated users straight to the dashboard.
    // Without this, clicking Sign In and completing login sends users back to '/',
    // creating a redirect loop.
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});


function Landing() {
  return (
    <div className="pos-grid-bg min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="mono text-sm font-bold tracking-tight">PlacementOS</span>
        </div>
        <Link
          to="/login"
          className="mono rounded-md border border-border bg-[oklch(0.21_0_0)] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-24 pt-16 text-center md:pt-28">
        <div className="mono mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-[oklch(0.21_0_0)] px-3 py-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>version — v1.0</span>
        </div>

        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
          The Operating System for
          <br />
          <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
            Placements.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          Every solved problem, every revision, every application, and every interview, Tracked in one intelligent dashboard.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="mono inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start Tracking <ArrowRight className="h-4 w-4" />
          </Link>
        </div>


        {/* Feature grid */}
        <div id="features" className="mt-24 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3">
          {[
            { icon: Layers, title: "Company pipeline", body: "Applied → Offer Accepeted → Interview → Offer. Move companies like Trello for careers." },
            { icon: Terminal, title: "LeetCode Metrics", body: "Track solves, difficulty split, and weekly trends without leaving the app." },
            { icon: LineChart, title: "Core Subject", body: "OS, DBMS, CN, OOP — checklist your syllabus with progress bars." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-5">
              <f.icon className="mb-3 h-5 w-5 text-primary" />
              <div className="mono text-sm font-semibold text-foreground">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex max-w-3xl flex-col items-center justify-center text-center px-4">
          <h2 className="text-gray-300 text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-3xl">
            Everything You Need. Nothing You Don't.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-lg">
            Built for placement preparation. Track coding, revision, projects, applications, interviews, and career milestones without unnecessary complexity.
          </p>
        </div>
      </section>
    </div>
  );
}
