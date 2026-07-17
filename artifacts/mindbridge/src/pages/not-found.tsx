import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <div className="bg-destructive/10 p-4 rounded-full">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">404 - Page Not Found</h1>
          <p className="text-muted-foreground text-lg">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Button asChild size="lg" className="mt-4">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </Layout>
  );
}
