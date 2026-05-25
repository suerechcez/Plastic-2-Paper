import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-foreground/90 p-0 sm:p-6">
      <div className="relative w-full sm:max-w-[400px] sm:h-[820px] h-screen sm:rounded-[2.5rem] overflow-hidden bg-background sm:border-[10px] sm:border-foreground shadow-2xl flex flex-col">
        <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-20" />
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground rounded-full" />
      </div>
    </div>
  );
}