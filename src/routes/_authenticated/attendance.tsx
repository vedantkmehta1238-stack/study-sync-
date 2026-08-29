import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { AlertTriangle, CalendarCheck, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { attendanceStats, ATTENDANCE_THRESHOLD } from "@/lib/attendance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — StudySync" },
      { name: "description", content: "Track subject-wise attendance with a 75% guardrail." },
    ],
  }),
  component: AttendancePage,
});

type Subject = { id: string; name: string; semester: number };
type AttendanceRow = {
  id: string;
  subject_id: string;
  status: "present" | "absent";
  attendance_date: string;
};

async function fetchAttendanceData() {
  const [sub, att] = await Promise.all([
    supabase.from("subjects").select("id,name,semester").order("name"),
    supabase.from("attendance").select("id,subject_id,status,attendance_date"),
  ]);
  if (sub.error) throw sub.error;
  if (att.error) throw att.error;
  return {
    subjects: (sub.data ?? []) as Subject[],
    attendance: (att.data ?? []) as AttendanceRow[],
  };
}

function AttendancePage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data, isLoading } = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendanceData });

  const subjects = data?.subjects ?? [];
  const attendance = data?.attendance ?? [];

  const activeSubjectId = selectedSubject ?? subjects[0]?.id ?? null;
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;
  const subjectRecords = useMemo(
    () => attendance.filter((a) => a.subject_id === activeSubjectId),
    [attendance, activeSubjectId],
  );
  const stats = attendanceStats(subjectRecords);

  const presentDates = subjectRecords.filter((r) => r.status === "present").map((r) => new Date(r.attendance_date));
  const absentDates = subjectRecords.filter((r) => r.status === "absent").map((r) => new Date(r.attendance_date));
  const recordOnDate = subjectRecords.find((r) => isSameDay(new Date(r.attendance_date), selectedDate));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        </header>
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <CalendarCheck className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Add subjects first — attendance is tracked per subject.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Subject-wise, one record per day. Green ≥ 75%, red below.
          </p>
        </div>
        <Select value={activeSubjectId ?? undefined} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} · Sem {s.semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {activeSubject && (
        <>
          <StatsRow stats={stats} />
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="rounded-xl border bg-card p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                modifiers={{ present: presentDates, absent: absentDates }}
                modifiersClassNames={{
                  present:
                    "bg-success/20 text-success rounded-md font-semibold aria-selected:bg-success/40",
                  absent:
                    "bg-destructive/20 text-destructive rounded-md font-semibold aria-selected:bg-destructive/40",
                }}
                disabled={{ after: new Date() }}
              />
            </div>
            <MarkPanel
              subjectId={activeSubject.id}
              subjectName={activeSubject.name}
              date={selectedDate}
              existing={recordOnDate}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StatsRow({ stats }: { stats: ReturnType<typeof attendanceStats> }) {
  const good = stats.total > 0 && stats.percent >= ATTENDANCE_THRESHOLD;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard label="Attendance" value={stats.total === 0 ? "—" : `${stats.percent}%`} tone={stats.total === 0 ? "neutral" : good ? "success" : "destructive"} />
      <StatCard label="Present" value={stats.present} tone="neutral" />
      <StatCard label="Absent" value={stats.absent} tone="neutral" />
      <StatCard label="Total sessions" value={stats.total} tone="neutral" />
      {!good && stats.total > 0 && (
        <div className="col-span-full flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Below {ATTENDANCE_THRESHOLD}% — attend the next classes to recover.
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "success" | "destructive";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MarkPanel({
  subjectId,
  subjectName,
  date,
  existing,
}: {
  subjectId: string;
  subjectName: string;
  date: Date;
  existing?: AttendanceRow;
}) {
  const queryClient = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");

  const upsert = useMutation({
    mutationFn: async (status: "present" | "absent") => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("attendance")
        .upsert(
          { user_id: uid, subject_id: subjectId, attendance_date: dateStr, status },
          { onConflict: "subject_id,attendance_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance updated");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!existing) return;
      const { error } = await supabase.from("attendance").delete().eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record cleared");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {format(date, "EEEE, d MMM yyyy")}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{subjectName}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {existing
          ? `Marked ${existing.status}. You can change or clear it.`
          : "Not marked yet."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => upsert.mutate("present")}
          disabled={upsert.isPending}
          className={cn(
            "gap-2",
            existing?.status === "present" && "bg-success text-success-foreground hover:bg-success/90",
          )}
          variant={existing?.status === "present" ? "default" : "outline"}
        >
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Present
        </Button>
        <Button
          onClick={() => upsert.mutate("absent")}
          disabled={upsert.isPending}
          className={cn(
            "gap-2",
            existing?.status === "absent" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          )}
          variant={existing?.status === "absent" ? "default" : "outline"}
        >
          <X className="h-4 w-4" />
          Absent
        </Button>
        {existing && (
          <Button variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
