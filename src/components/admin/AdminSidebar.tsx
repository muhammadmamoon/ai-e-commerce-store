"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Boxes,
  ClipboardList,
  Users,
  MessageSquare,
  TicketPercent,
  Sparkles,
  Settings,
  TrendingUp,
  Mail,
  X,
  Menu,
  ShieldCheck,
} from "lucide-react";

interface AdminSidebarProps {
  role: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Orders", href: "/admin/orders", icon: ClipboardList },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Subscriber", href: "/admin/subscribers", icon: Mail },
  { name: "AI Insights", href: "/admin/ai-insights", icon: Sparkles },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { name: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    superAdminOnly: true,
  },
];

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (item.superAdminOnly && role !== "SUPER_ADMIN") return false;
    return true;
  });

  const NavLinks = () => (
    <ul className="space-y-1 px-3 py-4">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
              />
              <span>{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Topbar Toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 font-bold text-white tracking-wide"
        >
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <span>STORE ADMIN</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
          <span className="font-bold text-lg text-white tracking-wide">
            Admin Workspace
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <NavLinks />
        </div>
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-950 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-none">
              CORE ADMIN
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase mt-0.5">
              Enterprise Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Security badge at footer of sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">RBAC Protected Mode</span>
          </div>
        </div>
      </aside>
    </>
  );
}
