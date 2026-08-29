import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
  Search,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { workSchema, type WorkValues } from "@/lib/validators";
import { cn } from "@/lib/utils";

export type WorkTable = "assignments" | "self_learning";

export type WorkItem = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "submitted" | "completed";
  teacher_name: string | null;
  subject_id: string;
  subject: { name: string; semester: number } | null;
};

type Subject = { id: string; name: string; semester: number };

const STATUS_LABEL: Record<WorkItem["status"], string> = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed",
};

const PRIORITY_TONE: Record<WorkItem["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-destructive/15 text-destructive",
};

export function WorkPage({
  table,
  title,
  addLabel,
  emptyCopy,
}: {
  table: WorkTable;
  title: string;
  addLabel: string;
  emptyCopy: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const items = useQuery({
    queryKey: [table, "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(
          "id,title,description,due_date,priority,status,teacher_name,subject_id,subject:subjects(name,semester)",
        )
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WorkItem[];
    },
  });

  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name,semester")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });

  const filtered = useMemo(() => {
    if (!items.data) return [];
    const q = search.trim().toLowerCase();
    return items.data.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (subjectFilter !== "all" && w.subject_id !== subjectFilter) return false;
      if (q && !`${w.title} ${w.description ?? ""} ${w.teacher_name ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items.data, search, statusFilter, subjectFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Every item is tied to a subject. Search, filter, and update as you go.
          </p>
        </div>
        <WorkDialog table={table} subjects={subjects.data ?? []} addLabel={addLabel} />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description, teacher…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as WorkItem["status"][]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {(subjects.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <ClipboardList className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{emptyCopy}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((w) => (
            <WorkCard key={w.id} item={w} table={table} subjects={subjects.data ?? []} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkCard({
  item,
  table,
  subjects,
}: {
  item: WorkItem;
  table: WorkTable;
  subjects: Subject[];
}) {
  const queryClient = useQueryClient();
  const done = item.status === "completed" || item.status === "submitted";

  const setStatus = useMutation({
    mutationFn: async (status: WorkItem["status"]) => {
      const { error } = await supabase.from(table).update({ status }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-semibold", done && "text-muted-foreground line-through")}>
              {item.title}
            </h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", PRIORITY_TONE[item.priority])}>
              {item.priority}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.subject?.name ?? "—"}
            {item.due_date && ` · Due ${format(new Date(item.due_date), "d MMM yyyy")}`}
            {item.teacher_name && ` · ${item.teacher_name}`}
          </p>
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <WorkDialog table={table} subjects={subjects} existing={item} trigger={
            <Button size="icon" variant="ghost" aria-label="Edit">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          } />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Delete">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => del.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          value={item.status}
          onValueChange={(v) => setStatus.mutate(v as WorkItem["status"])}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABEL) as WorkItem["status"][]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!done && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs text-success"
            onClick={() => setStatus.mutate(table === "assignments" ? "submitted" : "completed")}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark {table === "assignments" ? "submitted" : "done"}
          </Button>
        )}
        {done && (
          <Badge variant="secondary" className="gap-1 bg-success/15 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {STATUS_LABEL[item.status]}
          </Badge>
        )}
      </div>
    </li>
  );
}

function WorkDialog({
  table,
  subjects,
  addLabel,
  existing,
  trigger,
}: {
  table: WorkTable;
  subjects: Subject[];
  addLabel?: string;
  existing?: WorkItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: existing
      ? {
          title: existing.title,
          subject_id: existing.subject_id,
          description: existing.description ?? "",
          due_date: existing.due_date ? existing.due_date.slice(0, 10) : "",
          priority: existing.priority,
          status: existing.status,
          teacher_name: existing.teacher_name ?? "",
        }
      : {
          title: "",
          subject_id: "",
          description: "",
          due_date: "",
          priority: "medium",
          status: "pending",
          teacher_name: "",
        },
  });

  const save = useMutation({
    mutationFn: async (values: WorkValues) => {
      const payload = {
        title: values.title,
        subject_id: values.subject_id,
        description: values.description || null,
        due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
        priority: values.priority,
        status: values.status,
        teacher_name: values.teacher_name || null,
      };
      if (existing) {
        const { error } = await supabase.from(table).update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) throw new Error("Not signed in");
        const { error } = await supabase.from(table).insert({ ...payload, user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(existing ? "Updated" : "Added");
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (!existing) reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={subjects.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel ?? "Add"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit" : "New"}</DialogTitle>
        </DialogHeader>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a subject first — every item must belong to one.
          </p>
        ) : (
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-3.5">
            <Row>
              <FieldWrap label="Title" error={errors.title?.message}>
                <Input autoFocus {...register("title")} />
              </FieldWrap>
            </Row>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrap label="Subject" error={errors.subject_id?.message}>
                <Select
                  value={watch("subject_id")}
                  onValueChange={(v) => setValue("subject_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Due date">
                <Input type="date" {...register("due_date")} />
              </FieldWrap>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrap label="Priority">
                <Select
                  value={watch("priority")}
                  onValueChange={(v) => setValue("priority", v as WorkValues["priority"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Status">
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as WorkValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as WorkItem["status"][]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
            </div>
            <FieldWrap label="Teacher (optional)">
              <Input {...register("teacher_name")} />
            </FieldWrap>
            <FieldWrap label="Description (optional)">
              <Textarea rows={3} {...register("description")} />
            </FieldWrap>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldWrap({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
