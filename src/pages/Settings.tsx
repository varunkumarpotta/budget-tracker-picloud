import { LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";

export default function Settings() {
  const { user, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="p-5">
        <div className="text-sm font-semibold">Profile</div>
        <div className="mt-2 text-xs text-app-muted">
          Signed in as <span className="font-semibold text-app-foreground">{user?.email}</span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Theme</div>
            <div className="mt-1 text-xs text-app-muted">Light / Dark</div>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Light" : "Dark"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Security</div>
            <div className="mt-1 text-xs text-app-muted">
              Firebase Auth + server-side token verification (planned).
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              signOut();
              navigate("/auth", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}

