import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Heart, Mail, Sparkles } from "lucide-react";
import logoUrl from "/studysync-logo.png";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "About — StudySync" },
      { name: "description", content: "About StudySync and the team behind it." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <img
          src={logoUrl}
          alt="StudySync logo"
          className="h-14 w-14 rounded-xl object-contain"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">About StudySync</h1>
          <p className="text-sm text-muted-foreground">
            One calm workspace for your academic life.
          </p>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          What StudySync is
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          StudySync is a focused digital companion for engineering students. It brings
          together subject-wise attendance with a 75% guardrail, assignments, and
          faculty self-learning tasks — without the noise of a full ERP.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-primary" />
          Our promise
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Only the modules you use daily — no bloat.</li>
          <li>Your data is yours, protected by row-level security.</li>
          <li>Fast, clean, and mobile-first.</li>
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Heart className="h-4 w-4 text-primary" />
          Credits
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Designed and built by <span className="font-medium text-foreground">Vedant Mehta</span>{" "}
          for fellow students.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Feedback: send it anytime — StudySync grows with the people who use it.
        </p>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StudySync · v1.0
      </p>
    </div>
  );
}
