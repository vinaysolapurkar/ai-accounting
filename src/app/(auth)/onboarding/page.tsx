"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, BookHeart } from "lucide-react";
import { COUNTRY_CONFIG, type CountryCode } from "@/lib/supabase/types";

const businessTypes = [
  { value: "freelancer", label: "Freelancer", desc: "Individual contractor or self-employed" },
  { value: "sole_prop", label: "Sole Proprietor", desc: "Single-owner business" },
  { value: "llc", label: "LLC / LLP", desc: "Limited liability company or partnership" },
  { value: "corporation", label: "Corporation", desc: "Registered company" },
  { value: "nonprofit", label: "Non-Profit", desc: "Non-profit organization" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode | "">("");
  const [businessType, setBusinessType] = useState("");

  const handleComplete = async () => {
    const stored = localStorage.getItem("ledgerai_user");
    if (!stored) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(stored);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboarding",
          userId: user.id,
          country,
          businessType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Onboarding failed:", data.error);
        return;
      }

      localStorage.setItem("ledgerai_user", JSON.stringify(data.user));
    } catch (err) {
      console.error("Onboarding failed:", err);
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <BookHeart className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold" style={{fontFamily: 'var(--font-display)'}}>Numba</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step ? "bg-primary text-primary-foreground" :
                s === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Where is your business based?</CardTitle>
              <p className="text-muted-foreground">We&apos;ll set up the right tax rules and chart of accounts</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.entries(COUNTRY_CONFIG) as [CountryCode, typeof COUNTRY_CONFIG[CountryCode]][]).map(([code, config]) => (
                  <button
                    key={code}
                    onClick={() => setCountry(code)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      country === code ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                    }`}
                  >
                    <p className="font-medium text-sm">{config.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{config.taxType}</Badge>
                  </button>
                ))}
              </div>
              <Button className="w-full mt-6" disabled={!country} onClick={() => setStep(2)}>
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">What type of business?</CardTitle>
              <p className="text-muted-foreground">This helps us customize your experience</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businessTypes.map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() => setBusinessType(bt.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      businessType === bt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                    }`}
                  >
                    <p className="font-medium">{bt.label}</p>
                    <p className="text-sm text-muted-foreground">{bt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button disabled={!businessType} onClick={() => setStep(3)} className="flex-1">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <p className="text-muted-foreground">Here&apos;s what we&apos;ve set up for you</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Country: {country && COUNTRY_CONFIG[country as CountryCode]?.name}</p>
                    <p className="text-xs text-muted-foreground">Tax rules loaded ({country && COUNTRY_CONFIG[country as CountryCode]?.taxType})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Business Type: {businessTypes.find(b => b.value === businessType)?.label}</p>
                    <p className="text-xs text-muted-foreground">Customized chart of accounts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Currency: {country && COUNTRY_CONFIG[country as CountryCode]?.currency}</p>
                    <p className="text-xs text-muted-foreground">All amounts will default to this currency</p>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleComplete}>
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
