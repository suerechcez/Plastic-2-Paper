export function DashboardHeader({ name, studentId, bottlePoints }: { name: string; studentId: string; bottlePoints: number }) {
  const sheets = Math.floor(bottlePoints / 2);
  return (
    <div className="px-5 pt-6">
      <div className="bg-card rounded-r-[2.5rem] -ml-5 pl-5 pr-6 py-4 inline-block max-w-[85%]">
        <h1 className="text-4xl font-extrabold text-foreground leading-tight tracking-tight">{name}</h1>
        <p className="text-foreground text-sm mt-1 font-medium">{studentId}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <StatCard label="Bottle Points" value={bottlePoints} unit="PTS" icon={<BottleIcon />} />
        <StatCard label="Withdrawable Paper" value={sheets} unit="SHEETS" icon={<PaperIcon />} />
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: React.ReactNode }) {
  return (
    <div className="bg-primary/70 rounded-lg p-1.5 text-primary-foreground">
      <div className="text-[11px] font-medium px-1.5 py-0.5">{label}</div>
      <div className="bg-card/60 rounded-md p-2.5 flex items-center gap-2 text-primary-foreground">
        <div className="shrink-0">{icon}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold leading-none">{value}</span>
          <span className="text-[10px] font-semibold tracking-wide">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function BottleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4v2.5a3 3 0 0 0 .8 2L16 8a4 4 0 0 1 1 2.6V19a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-8.4A4 4 0 0 1 8 8l1.2-1.5a3 3 0 0 0 .8-2V2z" />
      <path d="M7 14h10" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}