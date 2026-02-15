import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen w-full">
    <DashboardSidebar />
    <main className="flex-1 p-6 lg:p-8 bg-background overflow-y-auto">
      {children}
    </main>
  </div>
);

export default DashboardLayout;
