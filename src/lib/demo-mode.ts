/**
 * Demo Mode — client-only mock user for testing the app.
 * No Supabase account is created. All data lives in localStorage
 * and is cleared on sign-out.
 */

const DEMO_KEY = "studysync.demoMode";
const DEMO_USER_KEY = "studysync.demoUser";

export interface DemoUser {
  id: string;
  email: string;
  full_name: string;
  enrollment_number: string;
  college_name: string;
  branch: string;
  semester: number;
  created_at: string;
}

const DEMO_USER: DemoUser = {
  id: "demo-00000000-0000-0000-0000-000000000001",
  email: "demo@studysync.app",
  full_name: "Demo User",
  enrollment_number: "DEMO001",
  college_name: "Demo College",
  branch: "CSE",
  semester: 3,
  created_at: new Date().toISOString(),
};

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_KEY) === "true";
}

export function getDemoUser(): DemoUser | null {
  if (!isDemoMode()) return null;
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEMO_USER;
    }
  }
  return DEMO_USER;
}

export function enterDemoMode(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_KEY, "true");
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(DEMO_USER));
}

export function exitDemoMode(): void {
  if (typeof window === "undefined") return;
  // Remove all demo-related keys
  localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  // Also clear any Supabase session keys
  Object.keys(localStorage)
    .filter((k) => k.startsWith("sb-"))
    .forEach((k) => localStorage.removeItem(k));
}

/**
 * Returns a mock Supabase-like session object for demo mode.
 */
export function getDemoSession() {
  const user = getDemoUser();
  if (!user) return null;
  return {
    access_token: "demo-token",
    refresh_token: "demo-refresh",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.full_name,
        enrollment_number: user.enrollment_number,
        college_name: user.college_name,
        branch: user.branch,
        semester: user.semester,
      },
      created_at: user.created_at,
      aud: "authenticated",
      role: "authenticated",
    },
  };
}
