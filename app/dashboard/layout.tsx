// This layout is now deprecated - using (dashboard)/layout.tsx instead
// Keeping this file to avoid breaking existing routes
// All dashboard pages should use the (dashboard) route group

export default function DeprecatedDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {children}
    </div>
  );
}