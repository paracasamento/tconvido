import "./admin-v6.css";
import { AdminAppChrome } from "@/components/admin/AdminAppChrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAppChrome>{children}</AdminAppChrome>;
}
