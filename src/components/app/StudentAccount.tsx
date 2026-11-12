import { useEffect, useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/shared";
import { supabase } from "@/integrations/supabase/client";
import { studentProfileQuery } from "@/lib/student-queries";
import { saveStudentProfile } from "@/lib/student.functions";
import { avatarError } from "@/lib/student-data";

export function StudentAvatar({ path, name, className = "h-10 w-10" }: { path: string | null; name: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    if (path) void supabase.storage.from("student-avatars").createSignedUrl(path, 3600).then(({ data }) => { if (active) setUrl(data?.signedUrl ?? null); });
    return () => { active = false; };
  }, [path]);
  return url ? <img src={url} alt={`${name || "Student"} avatar`} className={`${className} shrink-0 rounded-full object-cover`} /> : <span className={`${className} grid shrink-0 place-items-center rounded-full bg-teal-soft text-teal`} aria-label="Student avatar"><UserRound className="h-5 w-5" /></span>;
}

export function StudentAccount({ userId }: { userId: string }) {
  const { data: profile } = useSuspenseQuery(studentProfileQuery(userId));
  const queryClient = useQueryClient();
  const saveProfile = useServerFn(saveStudentProfile);
  const [name, setName] = useState(profile.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Enter your name.");
    setBusy(true); setError("");
    try {
      await saveProfile({ data: { displayName: name, avatarPath: profile.avatarPath } });
      await queryClient.invalidateQueries({ queryKey: ["student-profile", userId] });
      toast.success("Student profile saved");
    } catch (e) { setError(e instanceof Error ? e.message : "Your name could not be saved."); }
    finally { setBusy(false); }
  }

  async function upload(file: File) {
    const invalid = avatarError(file);
    if (invalid) return setError(invalid);
    setBusy(true); setError("");
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    let uploaded = false;
    let linked = false;
    try {
      const { error } = await supabase.storage.from("student-avatars").upload(path, file, { contentType: file.type });
      if (error) throw new Error("Your photo could not be uploaded. Please try again.");
      uploaded = true;
      await saveProfile({ data: { displayName: name.trim() || profile.displayName || "Student", avatarPath: path } });
      linked = true;
      if (profile.avatarPath) await supabase.storage.from("student-avatars").remove([profile.avatarPath]);
      await queryClient.invalidateQueries({ queryKey: ["student-profile", userId] });
      toast.success("Profile photo saved");
    } catch (e) {
      if (uploaded && !linked) await supabase.storage.from("student-avatars").remove([path]);
      setError(e instanceof Error ? e.message : "Your photo was not saved.");
    } finally { setBusy(false); }
  }

  async function removePhoto() {
    setBusy(true); setError("");
    try {
      await saveProfile({ data: { displayName: name.trim() || profile.displayName || "Student", avatarPath: null } });
      if (profile.avatarPath) await supabase.storage.from("student-avatars").remove([profile.avatarPath]);
      await queryClient.invalidateQueries({ queryKey: ["student-profile", userId] });
    } catch { setError("Your photo could not be removed."); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="Student Account" description="Your name and private profile photo." />
    <section className="max-w-xl space-y-6">
      <div className="flex flex-wrap items-center gap-4"><StudentAvatar path={profile.avatarPath} name={profile.displayName} className="h-24 w-24" /><div className="space-y-2"><Button type="button" variant="outline" disabled={busy} onClick={() => document.getElementById("avatar-upload")?.click()}><Camera /> Change photo</Button><input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload profile photo" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} /><p className="text-xs text-muted-foreground">PNG, JPEG or WebP · up to 2 MB</p>{profile.avatarPath && <Button variant="link" disabled={busy} className="h-auto p-0" onClick={() => void removePhoto()}>Remove photo</Button>}</div></div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void save(); }}><div className="space-y-1.5"><Label htmlFor="student-name">Your name</Label><Input id="student-name" value={name} maxLength={80} required disabled={busy} onChange={(e) => setName(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy}><Save />{busy ? "Saving…" : "Save profile"}</Button></form>
    </section>
  </>;
}