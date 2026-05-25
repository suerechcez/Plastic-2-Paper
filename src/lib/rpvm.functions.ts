import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const studentIdSchema = z.string().regex(/^[0-9]{10}$/, "Student ID must be exactly 10 digits");

export type RpvmUser = {
  studentId: string;
  name: string;
  bottlePoints: number;
};
export type RpvmTransaction = {
  id: string;
  date: string;
  amount: number;
  type: "deposit" | "withdraw";
};

function fmt(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} - ${d.getHours()}:${pad(d.getMinutes())}`;
}

export async function signupUser(input: { name: string; studentId: string }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> {
  try {
    const { name, studentId } = z.object({ name: z.string().trim().min(1).max(100), studentId: studentIdSchema }).parse(input);
    
    const { data: existing } = await supabase
      .from("rpvm_users")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle();
    
    if (existing) return { ok: false, error: "Student ID already registered" };
    
    const { data: row, error } = await supabase
      .from("rpvm_users")
      .insert({ student_id: studentId, name: name, bottle_points: 0 })
      .select("student_id, name, bottle_points")
      .single();
    
    if (error || !row) return { ok: false, error: error?.message ?? "Failed to create account" };
    
    return { ok: true, user: { studentId: row.student_id, name: row.name, bottlePoints: row.bottle_points } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function loginUser(input: { studentId: string }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> {
  try {
    const { studentId } = z.object({ studentId: studentIdSchema }).parse(input);
    
    const { data: row } = await supabase
      .from("rpvm_users")
      .select("student_id, name, bottle_points")
      .eq("student_id", studentId)
      .maybeSingle();
    
    if (!row) return { ok: false, error: "Student ID not registered" };
    
    return { ok: true, user: { studentId: row.student_id, name: row.name, bottlePoints: row.bottle_points } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function getDashboard(input: { studentId: string }): Promise<{ user: RpvmUser; transactions: RpvmTransaction[] } | null> {
  try {
    const { studentId } = z.object({ studentId: studentIdSchema }).parse(input);
    
    const [{ data: userRow }, { data: txRows }] = await Promise.all([
      supabase
        .from("rpvm_users")
        .select("student_id, name, bottle_points")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("rpvm_transactions")
        .select("id, amount, type, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    
    if (!userRow) return null;
    
    return {
      user: { studentId: userRow.student_id, name: userRow.name, bottlePoints: userRow.bottle_points },
      transactions: (txRows ?? []).map((t) => ({
        id: t.id,
        date: fmt(t.created_at),
        amount: t.amount,
        type: t.type as "deposit" | "withdraw",
      })),
    };
  } catch (err) {
    console.error('getDashboard error:', err);
    return null;
  }
}

export async function depositBottles(input: { studentId: string; amount?: number }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> {
  try {
    const { studentId, amount } = z.object({ studentId: studentIdSchema, amount: z.number().int().min(1).max(100).optional() }).parse(input);
    
    const depositAmount = amount ?? 2;
    const { data: row, error } = await supabase.rpc("rpvm_deposit", {
      p_student_id: studentId,
      p_amount: depositAmount,
    });
    
    if (error || !row) return { ok: false, error: error?.message ?? "Deposit failed" };
    
    const r = row as { student_id: string; name: string; bottle_points: number };
    return { ok: true, user: { studentId: r.student_id, name: r.name, bottlePoints: r.bottle_points } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function withdrawPaper(input: { studentId: string; sheets: number }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> {
  try {
    const { studentId, sheets } = z.object({ studentId: studentIdSchema, sheets: z.number().int().min(1).max(50) }).parse(input);
    
    const { data: row, error } = await supabase.rpc("rpvm_withdraw", {
      p_student_id: studentId,
      p_sheets: sheets,
    });
    
    if (error || !row) return { ok: false, error: error?.message ?? "Insufficient points" };
    
    const r = row as { student_id: string; name: string; bottle_points: number };
    return { ok: true, user: { studentId: r.student_id, name: r.name, bottlePoints: r.bottle_points } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}