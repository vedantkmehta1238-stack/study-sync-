import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Menu,
  BookMarked,
  MoreVertical,
  Settings,
  Info,
  User as UserIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { isDemoMode, exitDemoMode } from "@/lib/demo-mode";
import logoUrl from "/studysync-logo.png";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/self-learning", label: "Self-Learning", icon: BookMarked },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/attendance", label: "Attend.", icon: CalendarCheck },
  { to: "/assignments", label: "Work", icon: ClipboardList },
  { to: "/self-learning", label: "Learn", icon: BookMarked },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
] as const;

async function fetchHeaderProfile() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  let signedUrl: string | null = null;
  if (data?.avatar_url) {
    const { data: s } = await supabase.storage
      .from("avatars")
      .createSignedUrl(data.avatar_url, 60 * 60);
    signedUrl = s?.signedUrl ?? null;
  }
  return { fullName: data?.full_name ?? "", avatar: signedUrl };
}

export function AppShell({ children }: { children: ReactNode }) {
  const [openMobile, setOpenMobile] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
              <SidebarContent onNavigate={() => setOpenMobile(false)} />
            </SheetContent>
          </Sheet>
          <BrandMark />
          <MoreMenu />
        </header>

        <div className="hidden h-14 items-center justify-end gap-2 border-b bg-background/80 px-6 backdrop-blur md:flex">
          <MoreMenu />
        </div>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
      <img src={logoUrl} alt="StudySync logo" className="h-7 w-7 rounded-md object-contain" />
      StudySync
    </Link>
  );
}

function MoreMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile", "header"], queryFn: fetchHeaderProfile });

  const initials = (data?.fullName || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    const demo = isDemoMode();
    await queryClient.cancelQueries();
    queryClient.clear();
    if (demo) {
      exitDemoMode();
    } else {
      await supabase.auth.signOut();
    }
    toast.success(demo ? "Demo session cleared — no data saved" : "Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative h-9 w-9" aria-label="More">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {data?.avatar ? <AvatarImage src={data.avatar} alt="Avatar" /> : null}
            <AvatarFallback className="text-xs">
              {initials || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-sm font-medium">
            {data?.fullName || "Your account"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/about" })}>
          <Info className="mr-2 h-4 w-4" />
          About us
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
          <BookOpen className="mr-2 h-4 w-4" />
          Home page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile", "header"], queryFn: fetchHeaderProfile });

  const initials = (data?.fullName || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    const demo = isDemoMode();
    await queryClient.cancelQueries();
    queryClient.clear();
    if (demo) {
      exitDemoMode();
    } else {
      await supabase.auth.signOut();
    }
    toast.success(demo ? "Demo session cleared — no data saved" : "Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <BrandMark />
      </div>
      <button
        onClick={() => {
          onNavigate?.();
          navigate({ to: "/settings" });
        }}
        className="mx-3 mt-3 flex items-center gap-3 rounded-lg border p-2 text-left hover:bg-sidebar-accent/60"
      >
        <Avatar className="h-9 w-9">
          {data?.avatar ? <AvatarImage src={data.avatar} alt="Avatar" /> : null}
          <AvatarFallback className="text-xs">
            {initials || <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{data?.fullName || "Your account"}</p>
          <p className="truncate text-[11px] text-muted-foreground">View profile</p>
        </div>
      </button>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur md:hidden">
      {MOBILE_NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

