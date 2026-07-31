import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, PhoneCall, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recovera — Loan Recovery Management for Microfinance" },
      {
        name: "description",
        content:
          "Recovera is a loan recovery platform for NBFC-MFIs: portfolio dashboards, borrower calling, follow-ups, and branch-wise recovery reporting.",
      },
      { property: "og:title", content: "Recovera — Loan Recovery Management for Microfinance" },
      {
        property: "og:description",
        content:
          "Track collections, calls and follow-ups across branches with role-based access built for microfinance recovery teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const HIGHLIGHTS = [
  {
    icon: BarChart3,
    title: "Recovery intelligence",
    body: "Live collections, recovery rate and branch performance in one dashboard.",
  },
  {
    icon: PhoneCall,
    title: "Structured calling",
    body: "Capture outcomes, promise-to-pay and next follow-up on every borrower call.",
  },
  {
    icon: Users,
    title: "Branch & field teams",
    body: "Managers see their branch, executives see their allocation — automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Audit ready",
    body: "Every login, view, update and export is recorded in an immutable trail.",
  },
];

function LandingPage() {
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) void navigate({ to: "/dashboard", replace: true });
  }, [isLoading, user, navigate]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            R
          </span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            NBFC-MFI Platform
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Recovera gives microfinance recovery teams a single operating system for portfolio
            visibility, field calling, follow-up discipline and compliance-grade audit trails.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/auth">Access the platform</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Platform capabilities" className="grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
