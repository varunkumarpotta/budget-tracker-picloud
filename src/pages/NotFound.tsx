import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-app text-app-foreground">
      <div className="mx-auto max-w-xl px-4 pt-24">
        <Card className="p-6">
          <div className="font-display text-3xl tracking-tight">Page not found</div>
          <div className="mt-2 text-sm text-app-muted">
            The page you’re looking for doesn’t exist.
          </div>
          <div className="mt-6">
            <Link to="/">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to landing
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

