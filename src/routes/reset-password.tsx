import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Reset Student Password", "Choose a new password for your Student Skill Gap Analyzer account using your recovery email."),
  component: ResetPassword,
});

function ResetPassword() {
  const { user, ready } = useAuth();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || new URLSearchParams(window.location.search).get("type") === "recovery"); }, []);

  async function save() {
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else setDone(true);
    } catch { setError("The password could not be changed. Try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12"><h1 className="mb-6 text-2xl font-bold">Set a new password</h1>{done ? <><p role="status" className="mb-4 text-success">Your password has been changed.</p><Button asChild><Link to="/dashboard">Open dashboard</Link></Button></> : ready && !user ? <><p className="mb-4 text-sm text-muted-foreground">Open the reset link from your email. If it expired, request a new one.</p><Button asChild><Link to="/auth" search={{ next: "/dashboard" }}>Back to sign in</Link></Button></> : <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-4" data-recovery={recovery}><div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy || !ready || !user} className="w-full">{busy ? "Saving…" : "Save new password"}</Button></form>}</main>;
}