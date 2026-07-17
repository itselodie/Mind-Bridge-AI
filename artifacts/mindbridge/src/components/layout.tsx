import { Link, useLocation } from "wouter";
import { BookOpen, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/10">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-5xl h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MindBridge</span>
          </div>
          
          <nav className="flex items-center space-x-1">
            <Link href="/" className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              location === "/" 
                ? "bg-secondary text-secondary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}>
              Study
            </Link>
            <Link href="/dashboard" className={cn(
              "px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
              location === "/dashboard" 
                ? "bg-secondary text-secondary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}>
              <BarChart2 className="w-4 h-4" />
              <span>Progress</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
