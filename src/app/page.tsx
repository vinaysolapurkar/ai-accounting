"use client";

import Link from "next/link";
import {
  BookHeart,
  Camera,
  MessageSquare,
  BarChart3,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const displayFont = { fontFamily: "var(--font-display)" };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BookHeart className="w-7 h-7 text-primary" />
              <span
                className="text-lg font-bold text-foreground"
                style={displayFont}
              >
                Numba
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-up stagger-1 leading-[1.15]"
            style={displayFont}
          >
            Your finances, finally simple.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up stagger-2 leading-relaxed">
            Track money in and out, snap receipts, get reports &mdash; all in
            plain English. No accounting degree required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-base px-8 h-13 bg-primary text-primary-foreground"
              >
                Start for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base px-8 h-13">
                See how it works
              </Button>
            </a>
          </div>

          {/* Stat cards */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto animate-fade-up stagger-4">
            <div className="rounded-2xl bg-card shadow-warm p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">Money In</p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#6b9e78" }}
              >
                $12,400
              </p>
            </div>
            <div className="rounded-2xl bg-card shadow-warm p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">Money Out</p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#d4954b" }}
              >
                $4,200
              </p>
            </div>
            <div className="rounded-2xl bg-card shadow-warm p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">You Kept</p>
              <p className="text-2xl font-bold text-primary">$8,200</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4 animate-fade-up stagger-1"
            style={displayFont}
          >
            Everything you actually need
          </h2>
          <p className="text-center text-muted-foreground mb-14 animate-fade-up stagger-2">
            No bloat. No confusing menus. Just the stuff that matters.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Camera,
                color: "#6b9e78",
                bg: "rgba(107,158,120,0.1)",
                title: "Snap receipts",
                desc: "Take a photo. We read it. Done.",
              },
              {
                icon: MessageSquare,
                color: "#7c6fae",
                bg: "rgba(124,111,174,0.1)",
                title: "Ask questions",
                desc: "Type \u2018how much did I spend on food?\u2019 and get an answer.",
              },
              {
                icon: BarChart3,
                color: "#d4954b",
                bg: "rgba(212,149,75,0.1)",
                title: "See reports",
                desc: "Balance sheets, profit & loss \u2014 generated for you.",
              },
              {
                icon: Globe,
                color: "#5b9ec4",
                bg: "rgba(91,158,196,0.1)",
                title: "Works worldwide",
                desc: "GST, VAT, Sales Tax \u2014 we handle it all.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-2xl shadow-warm p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-warm-lg"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/40"
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14"
            style={displayFont}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              { step: "1", title: "Add your transactions", desc: "Type them, snap a receipt, or import a file." },
              { step: "2", title: "We organize everything", desc: "Categories, taxes, and double-entry \u2014 handled." },
              { step: "3", title: "Get clear reports", desc: "See where your money goes, in plain English." },
            ].map((s) => (
              <div key={s.step}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 bg-primary text-primary-foreground"
                  style={displayFont}
                >
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4"
            style={displayFont}
          >
            Simple pricing
          </h2>
          <p className="text-center text-muted-foreground mb-14">
            Start free, upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="bg-card rounded-2xl shadow-warm p-8">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-sm text-muted-foreground ml-1">
                  /month
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                For getting started
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "25 receipts/month",
                  "Basic reports",
                  "1 country",
                  "CSV export",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Start free
                </Button>
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div
              className="bg-card rounded-2xl shadow-warm-lg p-8 border-2 border-primary relative md:-translate-y-4"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold text-foreground">$29</span>
                <span className="text-sm text-muted-foreground ml-1">
                  /month
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                For growing businesses
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited receipts",
                  "All reports",
                  "All countries",
                  "AI chat assistant",
                  "5 team members",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full bg-primary text-primary-foreground">
                  Start trial
                </Button>
              </Link>
            </div>

            {/* Business */}
            <div className="bg-card rounded-2xl shadow-warm p-8">
              <h3 className="text-lg font-semibold text-foreground">Business</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold text-foreground">$79</span>
                <span className="text-sm text-muted-foreground ml-1">
                  /month
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                For teams & accountants
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Pro",
                  "Unlimited team members",
                  "Priority support",
                  "Custom tax rules",
                  "API access",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Contact sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-secondary/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-[1.15]"
            style={displayFont}
          >
            Ready to make sense of your money?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of people who stopped dreading their books.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="text-base px-10 h-14 bg-primary text-primary-foreground"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <BookHeart className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground" style={displayFont}>
                Numba
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Numba
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
