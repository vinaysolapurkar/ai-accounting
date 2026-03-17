import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold">LedgerAI</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold mb-4">
            AI-powered accounting made simple
          </h2>
          <p className="text-primary-foreground/70 text-lg">
            Snap receipts, chat with your books, generate reports. All in one app.
          </p>
        </div>
        <p className="text-primary-foreground/50 text-sm">
          Trusted by thousands of businesses worldwide
        </p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
