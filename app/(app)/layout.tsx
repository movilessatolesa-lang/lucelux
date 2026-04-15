import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
