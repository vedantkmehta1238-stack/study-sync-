export const ATTENDANCE_THRESHOLD = 75;

export function attendanceStats(records: { status: "present" | "absent" }[]) {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = total - present;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, absent, percent };
}

export function attendanceTone(percent: number, total: number) {
  if (total === 0) return "muted" as const;
  return percent >= ATTENDANCE_THRESHOLD ? ("success" as const) : ("destructive" as const);
}
