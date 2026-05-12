import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-app text-app-foreground">
      <div className="mx-auto flex max-w-7xl">
        <SidebarNav />
        <div className="min-w-0 flex-1">
          <TopBar />
          <main className="px-4 pb-28 pt-5 md:pb-10">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

