import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { apiPost } from "@/lib/api";

export default function Auth() {
  const { signInDemo, setUser } = useAuthStore();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/app/dashboard";
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, name };
      
      const res = await apiPost<{ token: string; user: { id: string; name: string; email: string } }>(endpoint, payload);
      
      setUser(res.data.user, res.data.token);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-app text-app-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-10 md:grid-cols-2 md:items-start">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-3xl tracking-tight">Welcome to Ledgerly</div>
              <div className="mt-2 text-sm text-app-muted">
                Sign in to sync expenses, splits, and card cycles across devices.
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-2xl border border-app-border/60 bg-app-surface/50 px-3 py-2 text-xs font-semibold text-app-foreground transition hover:bg-app-surface/70"
            >
              {isDark ? "Light" : "Dark"}
            </button>
          </div>

          <div className="mt-8 grid gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                signInDemo();
                navigate(redirectTo);
              }}
            >
              Try demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="text-xs text-app-muted">
              Demo mode stores data locally and uses a mock user profile.
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="text-sm font-semibold">{mode === "login" ? "Sign In" : "Create Account"}</div>
          <div className="mt-2 text-xs text-app-muted">
            {mode === "login" 
              ? "Enter your email and password to access your account." 
              : "Sign up for a free account to securely store your data."}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "register" && (
              <div>
                <div className="mb-1 text-xs font-semibold text-app-muted">Full Name</div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  disabled={loading}
                />
              </div>
            )}
            
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Email address</div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                inputMode="email"
                disabled={loading}
              />
            </div>
            
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Password</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <Button variant="primary" type="submit" disabled={loading} className="w-full">
              {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
            </Button>
            
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-xs text-[rgb(var(--accent))] hover:underline"
                disabled={loading}
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

