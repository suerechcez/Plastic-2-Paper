import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneFrame } from "@/components/PhoneFrame";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/rpvm-session";
import { getDashboard, withdrawPaper } from "@/lib/rpvm.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/dispense")({
  head: () => ({ meta: [{ title: "RPVM — Dispense" }, { name: "description", content: "Withdraw paper sheets" }] }),
  component: DispensePage,
});

type Stage = "idle" | "dispensing" | "success";

function DispensePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sid = typeof window !== "undefined" ? getSession() : null;
  const [qty, setQty] = useState(1);
  const [stage, setStage] = useState<Stage>("idle");

  useEffect(() => {
    if (!sid) navigate({ to: "/" });
  }, [sid, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", sid],
    queryFn: () => getDashboard({ studentId: sid! }),
    enabled: !!sid,
  });

  if (!sid || isLoading || !data) {
    return <PhoneFrame><div className="flex-1 bg-background" /></PhoneFrame>;
  }

  const { user, transactions } = data;
  const maxSheets = Math.floor(user.bottlePoints / 2);

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(Math.max(maxSheets, 1), q + 1));

  const handleDispense = async () => {
    if (stage !== "idle" || qty < 1 || qty > maxSheets) return;
    setStage("dispensing");
    const res = await withdrawPaper({ studentId: sid, sheets: qty });
    if (!res.ok) {
      setStage("idle");
      toast.error(res.error);
      return;
    }
    setStage("success");
    qc.invalidateQueries({ queryKey: ["dashboard", sid] });
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col bg-background overflow-y-auto relative">
        <Toaster position="top-center" />
        <DashboardHeader name={user.name} studentId={user.studentId} bottlePoints={user.bottlePoints} />
        <div className="px-6 pt-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={dec} disabled={stage !== "idle"} className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 rounded-md">
              <Minus className="w-5 h-5" />
            </Button>
            <div className="bg-accent rounded-md flex items-center justify-center text-accent-foreground text-lg font-semibold">{qty}</div>
            <Button onClick={inc} disabled={stage !== "idle"} className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 rounded-md">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <Button onClick={handleDispense} disabled={stage !== "idle" || maxSheets < 1} className="w-full h-10 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md">
            Dispense
          </Button>
          <Button onClick={() => navigate({ to: "/dashboard" })} disabled={stage !== "idle"} className="w-full h-10 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md">
            Exit
          </Button>
        </div>
        <div className="mx-6 mt-5 bg-card rounded-md flex-1 overflow-hidden">
          <div className="grid grid-cols-2 px-4 py-3 border-b border-border text-sm font-medium text-foreground">
            <span>Transaction Date</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="grid grid-cols-2 px-4 py-2 text-sm text-foreground">
                <span>{t.date}</span>
                <span className="text-right">{t.type === "withdraw" ? `-${t.amount}` : t.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {stage !== "idle" && (
          <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center z-30 backdrop-blur-sm">
            <div className="bg-card px-10 py-8 rounded-lg shadow-xl text-foreground text-base font-medium animate-in fade-in zoom-in">
              {stage === "dispensing" ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-primary animate-pulse" />
                  Dispensing...
                </span>
              ) : (
                "Successful!"
              )}
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}