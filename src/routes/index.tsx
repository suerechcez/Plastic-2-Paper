import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setSession } from "@/lib/rpvm-session";
import { loginUser } from "@/lib/rpvm.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "RPVM — Login" }, { name: "description", content: "IoT Reverse Paper Vending Machine login" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentId.trim();
    if (!/^\d{10}$/.test(id)) {
      toast.error("Student ID must be exactly 10 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ studentId: id });
      if (!res.ok) { toast.error(res.error); return; }
      setSession(id);
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneFrame>
      <Toaster position="top-center" />
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background">
        <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Login</h1>
          <Input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Student ID"
            className="bg-card border-border h-11 rounded-md text-center"
            inputMode="numeric"
            maxLength={10}
          />
          <Button type="submit" disabled={loading} className="h-9 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm">
            {loading ? "..." : "Login"}
          </Button>
          <Link to="/signup" className="mt-2 text-foreground text-sm hover:underline">Sign Up</Link>
        </form>
      </div>
    </PhoneFrame>
  );
}
