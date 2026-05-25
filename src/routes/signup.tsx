import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setSession } from "@/lib/rpvm-session";
import { signupUser } from "@/lib/rpvm.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "RPVM — Sign Up" }, { name: "description", content: "Register an RPVM account" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!/^\d{10}$/.test(studentId)) { toast.error("Student ID must be exactly 10 digits"); return; }
    setLoading(true);
    try {
      const res = await signupUser({ name: name.trim(), studentId });
      if (!res.ok) { toast.error(res.error); return; }
      setSuccess(true);
      setTimeout(() => {
        setSession(res.user.studentId);
        navigate({ to: "/dashboard" });
      }, 1000);
    } catch {
      toast.error("Sign up failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneFrame>
      <Toaster position="top-center" />
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background relative">
        {success && (
          <div className="absolute top-1/4 text-foreground text-base font-medium animate-in fade-in zoom-in">
            Successful!
          </div>
        )}
        <form onSubmit={handleSignup} className="w-full flex flex-col items-center gap-4 mt-16">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} className="bg-card border-border h-11 rounded-md text-center" />
          <Input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Student ID"
            className="bg-card border-border h-11 rounded-md text-center"
            inputMode="numeric"
            maxLength={10}
          />
          <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
            {loading ? "..." : "Sign Up"}
          </Button>
        </form>
      </div>
    </PhoneFrame>
  );
}