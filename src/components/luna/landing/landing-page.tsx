"use client";

/** Landing page complète — composition des sections. */
import { LandingNav } from "@/components/luna/landing/nav";
import { Hero } from "@/components/luna/landing/hero";
import { Features } from "@/components/luna/landing/features";
import { HowItWorks, FinalCta, LandingFooter } from "@/components/luna/landing/cta";

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
