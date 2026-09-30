"use client";

import { usePathname } from "next/navigation";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export function AdminAppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = pathname === "/admin/login" || pathname === "/admin/preview" || pathname === "/admin/editor";

  if (fullScreen) return <>{children}</>;

  return (
    <div className="admin-app-shell">
      <AdminTopBar />
      <div className="admin-app-main">{children}</div>
      <AdminBottomNav />
    </div>
  );
}
