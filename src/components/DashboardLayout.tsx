import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen w-full bg-muted/30">
    <DashboardSidebar />
    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      {children}
    </main>
  </div>
);

export default DashboardLayout;
