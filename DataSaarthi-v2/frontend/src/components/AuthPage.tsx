import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, UserPlus, User } from "lucide-react";
import { SaarthiLogo } from "@/components/SaarthiLogo";

export function AuthPage() {
  const { login, guestLogin } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.login(email, password);
      if (res.status === "success" && res.data?.user && res.data?.session?.access_token) {
        login(
          { id: res.data.user.id, email: res.data.user.email },
          res.data.session.access_token
        );
      } else {
        setError(res.detail || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setGuestBusy(true);
    try {
      await guestLogin();
    } catch (err: any) {
      setError(err.message || "Guest login failed");
    } finally {
      setGuestBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.register(email, password);
      if (res.status === "success") {
        setTab("login");
        setError("");
      } else {
        setError(res.detail || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[hsl(var(--canvas))] p-4 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-[hsl(var(--accent))] opacity-[0.06] blur-[120px] rounded-full -top-40 -right-40 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-[hsl(var(--accent))] opacity-[0.04] blur-[100px] rounded-full -bottom-20 -left-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient">
          <Card className="rounded-[var(--bezel-radius-inner)] shadow-bezel-inner w-full border-[hsl(var(--border-hairline))] bg-[hsl(var(--elevated))]">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] flex items-center justify-center shadow-lifted mx-auto">
                <SaarthiLogo size={26} />
              </div>
              <CardTitle className="font-display text-h1 text-[hsl(var(--text-primary))] text-center mt-3">DataSaarthi</CardTitle>
              <p className="text-caption text-[hsl(var(--text-tertiary))] text-center">Your Intelligent Data Charioteer</p>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--elevated))]">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label className="text-[hsl(var(--text-secondary))]">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[hsl(var(--text-secondary))]">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div>
                  <Label className="text-[hsl(var(--text-secondary))]">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[hsl(var(--text-secondary))]">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Register
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bezel-outer-bg))] hover:text-[hsl(var(--text-primary))]"
              onClick={handleGuest}
              disabled={guestBusy}
            >
              {guestBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
              Continue as Guest
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
