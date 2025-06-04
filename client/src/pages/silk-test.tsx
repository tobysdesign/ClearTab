import { Link } from "wouter";
import SilkBackground from "@/components/silk-background";

export default function SilkTest() {
  return (
    <SilkBackground className="min-h-screen">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Silk Background Test</h1>
          <p className="text-muted-foreground mb-6">
            This page demonstrates the reactbits.dev silk background with animated canvas effect
          </p>
          <Link href="/">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </SilkBackground>
  );
}