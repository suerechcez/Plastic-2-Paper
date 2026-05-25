import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneFrame } from "@/components/PhoneFrame";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/rpvm-session";
import { getDashboard, depositBottles } from "@/lib/rpvm.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "RPVM — Dashboard" }, { name: "description", content: "Your bottle points and withdrawable paper" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sid = typeof window !== "undefined" ? getSession() : null;

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

  const handleExit = () => { clearSession(); navigate({ to: "/" }); };

  const handleDeposit = async () => {
    try {
      const res = await depositBottles({ studentId: sid, amount: 2 });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Bottle accepted • +2 points");
      qc.invalidateQueries({ queryKey: ["dashboard", sid] });
    } catch {
      toast.error("Deposit failed");
    }
  };

  return (
    <PhoneFrame>
      <Toaster position="top-center" />
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        <DashboardHeader name={user.name} studentId={user.studentId} bottlePoints={user.bottlePoints} />
        <div className="px-5 pt-3 flex flex-col gap-2">
          <Button
            onClick={handleDeposit}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium"
          >
            Deposit
          </Button>
          <Button
            onClick={() => navigate({ to: "/dispense" })}
            disabled={user.bottlePoints < 2}
            className="w-full h-11 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-md font-medium"
          >
            Withdraw
          </Button>
          <Button onClick={handleExit} className="w-full h-11 bg-primary/70 hover:bg-primary/80 text-primary-foreground rounded-md font-medium">
            Exit
          </Button>
        </div>
        <div className="mx-5 mt-3 mb-5 bg-muted rounded-md flex-1 overflow-hidden">
          <div className="grid grid-cols-2 px-4 py-3 bg-card text-sm font-medium text-foreground">
            <span>Transaction Date</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="bg-card">
            {transactions.length === 0 && (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">No transactions yet</div>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="grid grid-cols-2 px-4 py-2 text-sm text-foreground">
                <span>{t.date}</span>
                <span className="text-right">{t.type === "withdraw" ? `-${t.amount}` : t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}