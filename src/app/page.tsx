"use client";

import Link from "next/link";
import {
  Camera,
  MessageSquare,
  FileText,
  Globe,
  ArrowRight,
  Receipt,
  BarChart3,
  Shield,
  Zap,
  Building2,
  Check,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Camera,
    title: "AI Receipt Scanner",
    description:
      "Snap a photo or upload a receipt. Our AI extracts vendor, amount, date, taxes, and line items instantly with 97% accuracy.",
  },
  {
    icon: MessageSquare,
    title: "Chat With Your Books",
    description:
      'Ask "What did I spend on travel last quarter?" or say "Record a payment" — your AI accountant understands natural language.',
  },
  {
    icon: FileText,
    title: "Auto Balance Sheet & Ledger",
    description:
      "Double-entry bookkeeping done automatically. Balance sheets, P&L, trial balance, and cash flow generated in one click.",
  },
  {
    icon: Globe,
    title: "Multi-Country Tax",
    description:
      "India GST, US Sales Tax, UK/EU VAT, Australia & NZ GST — all built-in with automatic compliance.",
  },
  {
    icon: Building2,
    title: "Export Anywhere",
    description:
      "Sync directly with Tally, QuickBooks, Sage, Zoho Books, Wave, and SAP. Or export as CSV, PDF, and XML.",
  },
  {
    icon: Shield,
    title: "AI Bank Reconciliation",
    description:
      "Upload bank statements and our AI auto-matches transactions. Review, confirm, and reconcile in minutes.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "25 receipts/month",
      "50 AI chat queries",
      "CSV export",
      "1 country",
      "Basic P&L report",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "For growing businesses",
    features: [
      "200 receipts/month",
      "500 AI chat queries",
      "2 integrations",
      "3 countries",
      "Full reports",
      "2 team members",
    ],
    cta: "Start Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious businesses",
    features: [
      "Unlimited receipts",
      "Unlimited AI queries",
      "All 6 integrations",
      "All countries",
      "AI bank reconciliation",
      "5 team members",
    ],
    cta: "Start Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$79",
    period: "/month",
    description: "For teams & firms",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Priority support",
      "Custom tax rules",
      "API access",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const countries = [
  { flag: "🇮🇳", name: "India", tax: "GST" },
  { flag: "🇺🇸", name: "USA", tax: "Sales Tax" },
  { flag: "🇬🇧", name: "UK", tax: "VAT" },
  { flag: "🇩🇪", name: "Germany", tax: "VAT" },
  { flag: "🇫🇷", name: "France", tax: "VAT" },
  { flag: "🇦🇺", name: "Australia", tax: "GST" },
  { flag: "🇳🇿", name: "New Zealand", tax: "GST" },
  { flag: "🇳🇱", name: "Netherlands", tax: "VAT" },
  { flag: "🇪🇸", name: "Spain", tax: "VAT" },
  { flag: "🇮🇹", name: "Italy", tax: "VAT" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance Designer, Mumbai",
    text: "I used to spend 3 hours a month on bookkeeping. Now I just snap photos of receipts and LedgerAI handles the rest. GST filing is a breeze!",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Small Business Owner, London",
    text: "The AI chat is incredible. I just ask questions about my finances and get instant answers. Exporting to Sage takes seconds.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    role: "Freelancer, Sydney",
    text: "Finally an accounting app that understands Australian GST properly. The bank reconciliation AI saves me hours every month.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LedgerAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#countries" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Countries</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started <ArrowRight className="ml-1 w-4 h-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              AI-Powered Accounting for Everyone
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your finances,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                understood
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Snap receipts, chat with your books, and generate reports instantly.
              LedgerAI handles GST, VAT, and sales tax across 10+ countries.
              Export to Tally, QuickBooks, Sage & more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-base px-8 h-12">
                  Start Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  See Features
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 25 free receipts every month.
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-b from-primary/5 to-transparent rounded-2xl border shadow-2xl overflow-hidden">
              <div className="bg-muted/30 border-b px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">app.ledgerai.com/dashboard</span>
                </div>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">$24,563</p>
                    <p className="text-xs text-green-600">+12.5% from last month</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950 dark:to-violet-900/50 border-violet-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Expenses</span>
                      <Receipt className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className="text-2xl font-bold">$8,234</p>
                    <p className="text-xs text-muted-foreground">142 transactions</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 border-green-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Net Profit</span>
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">$16,329</p>
                    <p className="text-xs text-green-600">Healthy margins</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to manage your books</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From receipt scanning to balance sheets, LedgerAI automates your entire accounting workflow with AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three steps to stress-free accounting</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Snap & Upload", description: "Take a photo of any receipt or invoice. Our AI reads it in seconds.", icon: Camera },
              { step: "2", title: "Confirm & Categorize", description: "Review AI-extracted data with one click. Journal entries auto-created.", icon: Check },
              { step: "3", title: "Export & Report", description: "Generate reports instantly. Export to Tally, QuickBooks, Sage & more.", icon: FileText },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section id="countries" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for businesses worldwide</h2>
            <p className="text-lg text-muted-foreground">Automatic tax compliance for every country you operate in</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {countries.map((country) => (
              <Card key={country.name} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{country.flag}</div>
                  <p className="font-medium text-sm">{country.name}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{country.tax}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Loved by businesses everywhere</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Start free, upgrade as you grow</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.highlighted ? "border-primary shadow-lg scale-105" : ""}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to simplify your accounting?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses who save hours every month with AI-powered bookkeeping.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base px-8 h-12">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">LedgerAI</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered accounting for small businesses worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LedgerAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
