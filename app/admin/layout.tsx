import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import AdminShell from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/dashboard");

  return <AdminShell>{children}</AdminShell>;
}
