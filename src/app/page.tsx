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
  Star,
  Receipt,
  Zap,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const d = { fontFamily: "var(--font-display)" } as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ━━━ NAV ━━━ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <BookHeart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold" style={d}>Numba</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground rounded-xl px-5">
                  Start free <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="pt-28 sm:pt-36 pb-8 sm:pb-16 px-5 sm:px-8 relative">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 dot-grid opacity-60" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              {/* Eyebrow */}
              <div className="animate-fade-up stagger-1 mb-6">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/8 px-4 py-1.5 rounded-full">
                  <Zap className="w-3.5 h-3.5" />
                  Free forever for small teams
                </span>
              </div>

              <h1
                className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-6 animate-fade-up stagger-2"
                style={d}
              >
                Stop dreading
                <br />
                <span className="text-primary">your books.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 animate-fade-up stagger-3 max-w-md">
                Numba turns receipts, expenses, and invoices into clear reports you actually understand. No jargon. No spreadsheets. No stress.
              </p>

              {/* CTA group */}
              <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-up stagger-4">
                <Link href="/signup">
                  <Button size="lg" className="text-base px-8 h-13 bg-primary text-primary-foreground rounded-xl shadow-warm-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                    Start for free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
              </div>

              {/* Social proof */}
              <div className="mt-10 animate-fade-up stagger-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    {["bg-primary", "bg-amber-400", "bg-emerald-400", "bg-blue-400", "bg-violet-400"].map((c, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}>
                        {["A", "M", "S", "J", "P"][i]}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Loved by <strong className="text-foreground">10,000+</strong> freelancers and small businesses
                </p>
              </div>
            </div>

            {/* Right: Visual — Receipt → Dashboard transformation */}
            <div className="relative h-[420px] sm:h-[480px] animate-fade-up stagger-4 hidden sm:block">
              {/* Receipt card — tilted, floating */}
              <div className="absolute top-4 left-0 w-52 animate-float-slow z-10">
                <div className="bg-card rounded-2xl shadow-warm-lg p-5 rotate-[-4deg] border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">#4821</span>
                  </div>
                  <div className="receipt-card space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coffee beans</span>
                      <span className="font-mono font-medium">$24.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Printer paper</span>
                      <span className="font-mono font-medium">$18.50</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxi ride</span>
                      <span className="font-mono font-medium">$32.00</span>
                    </div>
                    <div className="border-t border-dashed border-border pt-2 flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span className="font-mono">$74.50</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow / flow indicator */}
              <div className="absolute top-1/2 left-[45%] -translate-y-1/2 z-20">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-float">
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Dashboard card — clean, organized */}
              <div className="absolute top-8 right-0 w-64 animate-float-delayed z-10">
                <div className="bg-card rounded-2xl shadow-warm-lg p-5 rotate-[2deg] border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">March Overview</p>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm">Money In</span>
                      </div>
                      <span className="text-sm font-bold font-mono" style={{color: "#6b9e78"}}>$12,400</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-sm">Money Out</span>
                      </div>
                      <span className="text-sm font-bold font-mono" style={{color: "#d4954b"}}>$4,200</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span className="text-sm font-semibold">You Kept</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-primary">$8,200</span>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1.5 h-10">
                    {[40, 65, 45, 70, 55, 80, 60, 90, 75, 50, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-full bg-primary/15 overflow-hidden">
                        <div className="bg-primary rounded-full" style={{height: `${h}%`, transition: 'height 0.5s ease-out', transitionDelay: `${i * 50}ms`}} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute bottom-8 left-8 animate-float z-20">
                <div className="bg-card rounded-xl shadow-warm px-4 py-2.5 flex items-center gap-2 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium">Books balanced</span>
                </div>
              </div>

              {/* Another floating badge */}
              <div className="absolute bottom-24 right-4 animate-float-delayed z-20">
                <div className="bg-card rounded-xl shadow-warm px-4 py-2.5 flex items-center gap-2 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium">Receipt scanned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SOCIAL PROOF BAR ━━━ */}
      <section className="py-8 px-5 sm:px-8 border-y border-border/50 bg-secondary/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {[
            { num: "10,000+", label: "businesses" },
            { num: "10+", label: "countries" },
            { num: "$2B+", label: "tracked" },
            { num: "4.9/5", label: "rating" },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={d}>{s.num}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ PROBLEM → SOLUTION ━━━ */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={d}>
            Sound familiar?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Most small business owners spend 5+ hours a month on bookkeeping they hate. Numba gets that down to minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-border/50 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full">Before</span>
              </div>
              <div className="space-y-5 mt-4">
                {[
                  { icon: "📄", text: "Receipts stuffed in a shoebox" },
                  { icon: "😰", text: "Panic before tax season" },
                  { icon: "📊", text: "Spreadsheets that never add up" },
                  { icon: "💸", text: "Paying an accountant $200/month" },
                  { icon: "❓", text: "\"Am I even profitable?\"" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/30">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="bg-card rounded-2xl shadow-warm-lg p-8 border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">With Numba</span>
              </div>
              <div className="space-y-5 mt-4">
                {[
                  { icon: "📸", text: "Snap a photo, done in seconds" },
                  { icon: "😌", text: "Tax reports generated automatically" },
                  { icon: "✅", text: "Books that always balance" },
                  { icon: "🆓", text: "Free plan that actually works" },
                  { icon: "📈", text: "\"I made $8,200 this month!\"" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="py-24 px-5 sm:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={d}>
              Four things. Done perfectly.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We intentionally left out the 47 features you&apos;ll never use.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Camera,
                color: "#6b9e78",
                bg: "rgba(107,158,120,0.1)",
                title: "Snap receipts",
                desc: "Photograph any receipt. Our AI reads the vendor, amount, date, and tax in under 3 seconds. Then files it for you.",
                tag: "AI-powered",
              },
              {
                icon: MessageSquare,
                color: "#7c6fae",
                bg: "rgba(124,111,174,0.1)",
                title: "Ask anything",
                desc: "\"How much did I spend on food this quarter?\" Type it like you'd text a friend. Get a real answer, not a spreadsheet.",
                tag: "Natural language",
              },
              {
                icon: BarChart3,
                color: "#d4954b",
                bg: "rgba(212,149,75,0.1)",
                title: "Instant reports",
                desc: "Balance sheet. Profit & loss. Trial balance. Generated in one click, not after 3 hours of reconciliation.",
                tag: "One-click",
              },
              {
                icon: Globe,
                color: "#5b9ec4",
                bg: "rgba(91,158,196,0.1)",
                title: "Works everywhere",
                desc: "India GST. US Sales Tax. UK VAT. Australian GST. We handle the tax rules — you just do business.",
                tag: "10+ countries",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-card rounded-2xl shadow-warm p-8 border border-border/50 transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: f.bg }}
                  >
                    <f.icon className="w-7 h-7" style={{ color: f.color }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={d}>{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={d}>
            Three steps. That&apos;s it.
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-md mx-auto">
            If you can take a photo and type a sentence, you can do your books.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-[2px] bg-border z-0" />

            {[
              {
                step: "1",
                title: "Toss in your receipts",
                desc: "Snap a photo, type it in, or just tell our AI. We accept anything.",
                icon: Camera,
              },
              {
                step: "2",
                title: "We handle the boring parts",
                desc: "Categorization, double-entry, tax codes — all automatic.",
                icon: Zap,
              },
              {
                step: "3",
                title: "See where you stand",
                desc: "Clear reports in plain English. Know your numbers in 10 seconds.",
                icon: BarChart3,
              },
            ].map((s) => (
              <div key={s.step} className="text-center relative z-10 px-6 py-6">
                <div className="w-20 h-20 rounded-2xl bg-card shadow-warm border border-border/50 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary" style={d}>{s.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <section className="py-24 px-5 sm:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={d}>
            Don&apos;t take our word for it
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Here&apos;s what real business owners say.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I used to spend 3 hours a month on bookkeeping. With Numba, I spend 10 minutes. My accountant was shocked at how organized everything was at tax time.",
                name: "Priya Sharma",
                role: "Freelance Designer, Mumbai",
              },
              {
                quote: "The AI chat is a game-changer. I just ask 'how much did I spend on software?' and it tells me. No digging through spreadsheets. Ever.",
                name: "James Wilson",
                role: "Agency Owner, London",
              },
              {
                quote: "Finally an accounting app that doesn't make me feel stupid. Everything is in plain English. I actually understand my own finances now.",
                name: "Sarah Chen",
                role: "Freelancer, Sydney",
              },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-2xl shadow-warm p-7 border border-border/50 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={d}>
            Less than your daily coffee
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-md mx-auto">
            An accountant costs $200/month. A coffee costs $5/day. Numba starts at $0.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-border/50">
              <h3 className="text-lg font-bold" style={d}>Free</h3>
              <div className="mt-4 mb-2">
                <span className="text-5xl font-bold" style={d}>$0</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Forever. No tricks.</p>
              <ul className="space-y-3.5 mb-8">
                {["25 receipts/month", "Basic reports", "1 country", "CSV export"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Start free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-card rounded-2xl shadow-warm-lg p-8 border-2 border-primary relative md:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-warm" style={d}>
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-lg font-bold" style={d}>Pro</h3>
              <div className="mt-4 mb-2">
                <span className="text-5xl font-bold" style={d}>$29</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Less than $1/day</p>
              <ul className="space-y-3.5 mb-8">
                {["Unlimited receipts", "All reports", "All countries", "AI chat assistant", "5 team members", "Export to Tally, QuickBooks"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground">
                  Start 14-day trial <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Business */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-border/50">
              <h3 className="text-lg font-bold" style={d}>Business</h3>
              <div className="mt-4 mb-2">
                <span className="text-5xl font-bold" style={d}>$79</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">For growing teams</p>
              <ul className="space-y-3.5 mb-8">
                {["Everything in Pro", "Unlimited team members", "Priority support", "Custom tax rules", "API access"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Contact sales
                </Button>
              </Link>
            </div>
          </div>

          {/* Risk reversal */}
          <p className="text-center text-sm text-muted-foreground mt-10">
            <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            14-day free trial on all paid plans. Cancel anytime. No questions asked.
          </p>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-28 px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-[1.12]"
            style={d}
          >
            Your future self will
            <br />
            <span className="text-primary">thank you.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Every day you put off organizing your books is another day of stress. Start today — it takes 2 minutes.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base px-10 h-14 bg-primary text-primary-foreground rounded-xl shadow-warm-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-5">
            Free forever. Upgrade only when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="py-16 px-5 sm:px-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <BookHeart className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold" style={d}>Numba</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple accounting for people who&apos;d rather be doing literally anything else.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Numba. Made for humans who hate spreadsheets.
          </div>
        </div>
      </footer>
    </div>
  );
}
