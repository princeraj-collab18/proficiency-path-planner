import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { safeReturnPath } from "@/lib/student-data";
import { pageHead } from "@/lib/seo";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ next: safeReturnPath(search.next) }),
  head: () => pageHead("Student Sign In", "Sign in or create your student account to privately save skills, progress, gap analyses and reports."),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    const saved = sessionStorage.getItem("student-auth-return");
    sessionStorage.removeItem("student-auth-return");
    void navigate({ to: safeReturnPath(saved ?? next), replace: true });
  }, [user, ready, navigate, next]);

  async function submit() {
    setError(""); setMessage(""); setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Enter your name."); return; }
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
        } });
        if (result.error) { setError(result.error.message); return; }
        if (!result.data.session) setMessage("Check your email to confirm your account, then sign in. If you already have an account, use Sign in.");
      } else if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) setError(result.error.message);
        else setMessage("If an account exists for this email, a password reset link is on its way.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) setError(result.error.message);
      }
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }

  async function social(provider: "google" | "lovable") {
    setError(""); setBusy(true);
    sessionStorage.setItem("student-auth-return", next);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) setError(result.error.message);
    } catch { setError("Sign-in could not be completed. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link to="/" className="mb-7 flex items-center gap-3 text-lg font-bold"><GraduationCap className="h-8 w-8 text-primary" /> Student Skill Gap Analyzer</Link>
      <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your student account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">Your skills, progress and reports. Saved privately to your account.</p>
      {mode !== "forgot" && <Tabs className="mb-5" value={mode} onValueChange={(v) => { setMode(v === "signup" ? "signup" : "login"); setError(""); setMessage(""); }}><TabsList className="w-full"><TabsTrigger value="login" className="flex-1">Sign in</TabsTrigger><TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger></TabsList></Tabs>}
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
        {mode === "signup" && <div className="space-y-1.5"><Label htmlFor="auth-name">Your name</Label><Input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></div>}
        <div className="space-y-1.5"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        {mode !== "forgot" && <div className="space-y-1.5"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "signup" ? 8 : undefined} required />{mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}</div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-success-soft p-3 text-sm text-success"><Mail className="mr-2 inline h-4 w-4" />{message}</p>}
        <Button disabled={busy || !ready} type="submit" className="w-full">{busy && <Loader2 className="animate-spin" />}{mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
      </form>
      {mode === "login" && <Button variant="link" className="mt-2 self-start px-0" onClick={() => { setMode("forgot"); setMessage(""); setError(""); }}>Forgot password?</Button>}
      {mode === "forgot" ? <Button variant="link" className="mt-3 self-start px-0" onClick={() => { setMode("login"); setMessage(""); setError(""); }}>Back to sign in</Button> : <>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button className="google-auth-button w-full" variant="outline" disabled={busy} onClick={() => void social("google")}><svg aria-hidden width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button>
        <Button className="lovable-auth-button mt-3 w-full" disabled={busy} onClick={() => void social("lovable")}>Continue with Lovable</Button>
      </>}
    </main>
  );
}