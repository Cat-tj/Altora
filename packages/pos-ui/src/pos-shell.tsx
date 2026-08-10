import React from "react";

export interface PosShellProps {
  sidebarSlot?: React.ReactNode;
  catalogSlot: React.ReactNode;
  cartSlot: React.ReactNode;
  headerSlot?: React.ReactNode;
}

export function PosShell({
  sidebarSlot,
  catalogSlot,
  cartSlot,
  headerSlot,
}: PosShellProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {headerSlot && <header className="h-14 border-b border-slate-200 bg-white flex-shrink-0">{headerSlot}</header>}
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarSlot && (
          <aside className="w-52 border-r border-slate-200 bg-slate-900 text-slate-100 flex-shrink-0 hidden md:block">
            {sidebarSlot}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {catalogSlot}
        </main>

        <aside className="w-80 md:w-96 flex-shrink-0 h-full">
          {cartSlot}
        </aside>
      </div>
    </div>
  );
}
