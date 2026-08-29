import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import VariableProximity from "@/components/VariableProximity";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  BookMarked,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { attendanceStats, ATTENDANCE_THRESHOLD } from "@/lib/attendance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudySync" },
      { name: "description", content: "Your academic day at a glance." },
    ],
  }),
  component: DashboardPage,
});

type SubjectRow = { id: string; name: string; semester: number };
type AttendanceRow = { subject_id: string; status: "present" | "absent" };
type WorkRow = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  subject: { name: string } | null;
};

async function fetchDashboard() {
  const { data: profile } = await supabase.from("profiles").select("full_name").maybeSingle();
  const [subjectsRes, attRes, aRes, sRes] = await Promise.all([
    supabase.from("subjects").select("id,name,semester"),
    supabase.from("attendance").select("subject_id,status"),
    supabase
      .from("assignments")
      .select("id,title,due_date,status,subject:subjects(name)")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("self_learning")
      .select("id,title,due_date,status,subject:subjects(name)")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
  ]);
  if (subjectsRes.error) throw subjectsRes.error;
  if (attRes.error) throw attRes.error;
  if (aRes.error) throw aRes.error;
  if (sRes.error) throw sRes.error;
  return {
    name: profile?.full_name ?? "there",
    subjects: (subjectsRes.data ?? []) as SubjectRow[],
    attendance: (attRes.data ?? []) as AttendanceRow[],
    assignments: (aRes.data ?? []) as unknown as WorkRow[],
    selfLearning: (sRes.data ?? []) as unknown as WorkRow[],
  };
}

function DashboardPage() {
  const welcomeContainerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const perSubject = data.subjects.map((s) => {
    const recs = data.attendance.filter((a) => a.subject_id === s.id);
    return { subject: s, stats: attendanceStats(recs) };
  });
  const lowAttendance = perSubject.filter(
    (p) => p.stats.total > 0 && p.stats.percent < ATTENDANCE_THRESHOLD,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d MMM")}
          </p>
          <div ref={welcomeContainerRef} style={{ position: 'relative' }}>
            <VariableProximity
              label={`Welcome back, ${data.name.split(" ")[0] || "student"}`}
              className="text-2xl font-semibold tracking-tight md:text-3xl"
              fromFontVariationSettings="'wght' 400, 'opsz' 9"
              toFontVariationSettings="'wght' 800, 'opsz' 40"
              containerRef={welcomeContainerRef}
              radius={120}
              falloff="linear"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/attendance">Mark attendance</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/assignments">New assignment</Link>
          </Button>
        </div>
      </header>

      <section>
        <SectionTitle
          icon={CalendarCheck}
          title="Attendance"
          action={<LinkAction to="/attendance" label="View all" />}
        />
        {perSubject.length === 0 ? (
          <EmptyState
            message="Add your first subject to start tracking attendance."
            actionTo="/subjects"
            actionLabel="Add a subject"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {perSubject.map(({ subject, stats }) => {
              const below = stats.total > 0 && stats.percent < ATTENDANCE_THRESHOLD;
              return (
                <div
                  key={subject.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sem {subject.semester}
                      </p>
                    </div>
                    <AttendancePill percent={stats.percent} total={stats.total} />
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {stats.total === 0
                      ? "No records yet"
                      : `${stats.present} present · ${stats.absent} absent · ${stats.total} total`}
                  </div>
                  {below && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Below {ATTENDANCE_THRESHOLD}% — attend upcoming classes.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {lowAttendance.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {lowAttendance.length} subject{lowAttendance.length > 1 ? "s" : ""} below{" "}
            {ATTENDANCE_THRESHOLD}%
          </div>
          <p className="mt-1 text-destructive/80">
            {lowAttendance.map((l) => l.subject.name).join(" · ")}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkPreview
          title="Pending assignments"
          icon={ClipboardList}
          items={data.assignments}
          toAll="/assignments"
          emptyMsg="No pending assignments. Nice."
        />
        <WorkPreview
          title="Faculty self-learning"
          icon={BookMarked}
          items={data.selfLearning}
          toAll="/self-learning"
          emptyMsg="No pending self-learning tasks."
        />
      </div>
    </div>
  );
}

function AttendancePill({ percent, total }: { percent: number; total: number }) {
  if (total === 0)
    return (
      <Badge variant="secondary" className="rounded-full">
        —
      </Badge>
    );
  const good = percent >= ATTENDANCE_THRESHOLD;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        good
          ? "bg-success/15 text-success"
          : "bg-destructive/15 text-destructive",
      )}
    >
      {percent}%
    </span>
  );
}

function WorkPreview({
  title,
  icon: Icon,
  items,
  toAll,
  emptyMsg,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: WorkRow[];
  toAll: "/assignments" | "/self-learning";
  emptyMsg: string;
}) {
  return (
    <section>
      <SectionTitle icon={Icon} title={title} action={<LinkAction to={toAll} label="View all" />} />
      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-success" />
          {emptyMsg}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{w.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {w.subject?.name ?? "—"}
                  {w.due_date && ` · Due ${format(new Date(w.due_date), "d MMM")}`}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {w.status.replace("_", " ")}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      {action}
    </div>
  );
}

function LinkAction({ to, label }: { to: "/attendance" | "/assignments" | "/self-learning"; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <Link to={to}>
        {label} <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </Button>
  );
}

function EmptyState({
  message,
  actionTo,
  actionLabel,
}: {
  message: string;
  actionTo: "/subjects";
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild size="sm" className="mt-3">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
