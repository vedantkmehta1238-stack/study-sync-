import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
const logoUrl = "/studysync-logo.png";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { enterDemoMode } from "@/lib/demo-mode";
import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from "@/lib/validators";

const DEMO_EMAIL = "demo@studysync.app";
const DEMO_PASSWORD = "Demo#Stud9Sync!2026";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — StudySync" },
      { name: "description", content: "Sign in or create your StudySync account." },
      { property: "og:title", content: "Sign in — StudySync" },
      { property: "og:description", content: "Access your academic workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, go straight to dashboard (persistent session)
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2.5 self-center font-semibold">
          <img src={logoUrl} alt="StudySync logo" className="h-14 w-auto" />
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Tabs defaultValue={mode === "signup" ? "signup" : "signin"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="pt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to use StudySync for personal academic tracking.
        </p>
      </div>
    </div>
  );
}

/* ─── Sign In ─── */
function SignInForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  /* Auto-fill demo credentials */
  const fillDemo = () => {
    setValue("email", DEMO_EMAIL, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  /* Quick demo login — local-only mock, no Supabase needed */
  const handleDemoLogin = () => {
    enterDemoMode();
    toast.success("Demo mode activated — data is temporary");
    navigate({ to: "/dashboard", replace: true });
  };

  const onSubmit = async (values: SignInValues) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <button
        type="button"
        onClick={handleDemoLogin}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        ⚡ Try demo instantly — no signup needed
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or sign in manually</span>
        </div>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        After first login, you'll stay signed in automatically.
      </p>
    </form>
  );
}

/* ─── Sign Up ─── */
function SignUpForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { semester: 1 },
  });

  const semester = watch("semester");

  const onSubmit = async (values: SignUpValues) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          enrollment_number: values.enrollment_number,
          college_name: values.college_name,
          branch: values.branch,
          semester: values.semester,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're signed in!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <Field label="Full name" error={errors.full_name?.message}>
        <Input autoComplete="name" {...register("full_name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message} hint="8+ chars incl. upper, lower, number, special">
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Enrollment number" error={errors.enrollment_number?.message}>
        <Input {...register("enrollment_number")} />
      </Field>
      <Field label="College" error={errors.college_name?.message}>
        <Input {...register("college_name")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Branch" error={errors.branch?.message}>
          <Input {...register("branch")} placeholder="e.g. CSE" />
        </Field>
        <Field label="Semester" error={errors.semester?.message}>
          <Select
            value={String(semester ?? 1)}
            onValueChange={(v) => setValue("semester", Number(v), { shouldValidate: true })}
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
        </Field>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You'll stay signed in automatically after creating your account.
      </p>
    </form>
  );
}

/* ─── Reusable Field ─── */
function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
