import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Monitor, Moon, Sun, Upload, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StudySync" },
      { name: "description", content: "Manage your profile photo and app preferences." },
    ],
  }),
  component: SettingsPage,
});

const SKIP_LANDING_KEY = "studysync.skipLanding";

async function fetchProfile() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,college_name,branch,semester,enrollment_number,email")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  let signedAvatar: string | null = null;
  if (data?.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(data.avatar_url, 60 * 60);
    signedAvatar = signed?.signedUrl ?? null;
  }
  return { user, profile: data, signedAvatar };
}

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile", "me"], queryFn: fetchProfile });
  const [uploading, setUploading] = useState(false);
  const [skipLanding, setSkipLanding] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSkipLanding(localStorage.getItem(SKIP_LANDING_KEY) === "true");
  }, []);

  if (isLoading || !data) return <SettingsSkeleton />;

  const initials = (data.profile?.full_name || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${data.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", data.user.id);
      if (pErr) throw pErr;
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };




  const toggleSkipLanding = (v: boolean) => {
    setSkipLanding(v);
    localStorage.setItem(SKIP_LANDING_KEY, String(v));
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile photo and app preferences.</p>
      </header>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {data.signedAvatar ? <AvatarImage src={data.signedAvatar} alt="Avatar" /> : null}
            <AvatarFallback className="text-lg">
              {initials || <UserIcon className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button size="sm" onClick={onPickFile} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG or JPG, up to 5MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Edit Information
          </h2>
          {!showEditForm ? (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditForm(true)}
              >
                Edit Information
              </Button>
            </div>
          ) : (
            <ProfileInfoForm
              userId={data.user.id}
              email={data.user.email ?? ""}
              initial={{
                full_name: data.profile?.full_name ?? "",
                enrollment_number: data.profile?.enrollment_number ?? "",
                college_name: data.profile?.college_name ?? "",
                branch: data.profile?.branch ?? "",
                semester: data.profile?.semester ?? 1,
              }}
              onCancel={() => setShowEditForm(false)}
            />
          )}
        </div>
      </section>


      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Choose how StudySync looks.</p>
        <ThemeSelector />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          App preferences
        </h2>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Always show home page on launch</p>
            <p className="text-xs text-muted-foreground">
              When on, opening StudySync always lands on the home page. Turn off to jump
              straight to your dashboard when signed in.
            </p>
          </div>
          <Switch checked={!skipLanding} onCheckedChange={(v) => toggleSkipLanding(!v)} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notifications
        </h2>
        <div className="mt-4 space-y-3">
          <PrefRow
            title="Low-attendance alerts"
            desc="Nudge me when a subject drops below 75%."
            storageKey="studysync.notifyLowAttendance"
            defaultOn
          />
          <PrefRow
            title="Assignment reminders"
            desc="Toast reminders for assignments due within 48 hours."
            storageKey="studysync.notifyAssignments"
            defaultOn
          />
        </div>
      </section>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {options.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition",
              active
                ? "border-primary bg-accent text-accent-foreground"
                : "hover:bg-accent/60",
            )}
            aria-pressed={active}
          >
            <o.icon className="h-5 w-5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PrefRow({
  title,
  desc,
  storageKey,
  defaultOn,
}: {
  title: string;
  desc: string;
  storageKey: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  useEffect(() => {
    const v = localStorage.getItem(storageKey);
    if (v !== null) setOn(v === "true");
  }, [storageKey]);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          localStorage.setItem(storageKey, String(v));
        }}
      />
    </div>
  );
}

function ProfileInfoForm({
  userId,
  email,
  initial,
  onCancel,
}: {
  userId: string;
  email: string;
  initial: {
    full_name: string;
    enrollment_number: string;
    college_name: string;
    branch: string;
    semester: number;
  };
  onCancel?: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.full_name, initial.enrollment_number, initial.college_name, initial.branch, initial.semester]);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const onSave = async () => {
    if (!values.full_name.trim()) return toast.error("Name can't be empty");
    if (!values.enrollment_number.trim()) return toast.error("Enrollment number required");
    if (!values.college_name.trim()) return toast.error("College required");
    if (!values.branch.trim()) return toast.error("Branch required");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name.trim(),
        enrollment_number: values.enrollment_number.trim(),
        college_name: values.college_name.trim(),
        branch: values.branch.trim(),
        semester: Number(values.semester),
      })
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    onCancel?.();
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Full name</Label>
          <Input value={values.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Email</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Enrollment number</Label>
          <Input
            value={values.enrollment_number}
            onChange={(e) => set("enrollment_number", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">College</Label>
          <Input
            value={values.college_name}
            onChange={(e) => set("college_name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Branch</Label>
          <Input value={values.branch} onChange={(e) => set("branch", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Semester</Label>
          <Select
            value={String(values.semester)}
            onValueChange={(v) => set("semester", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Semester {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
