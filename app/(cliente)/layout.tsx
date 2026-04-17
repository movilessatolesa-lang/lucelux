"use client";

import { ReactNode } from "react";

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {children}
    </div>
  );
}
