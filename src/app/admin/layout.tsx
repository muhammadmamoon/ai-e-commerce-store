import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import React from "react";

const ALLOWED_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 1. Authentication Check
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  // 2. Authorization Check (Strict Role-Based Access Control)
  if (!ALLOWED_ADMIN_ROLES.includes(session.user.role)) {
    redirect("/?error=Unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Responsive Admin Sidebar (Drawer on mobile, fixed on desktop) */}
      <AdminSidebar role={session.user.role} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader user={session.user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900/60">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
