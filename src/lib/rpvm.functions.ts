import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

export const signupUser = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; studentId: string }) =>
    z.object({ name: z.string().trim().min(1).max(100), studentId: studentIdSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> => {
    const { data: existing } = await supabaseAdmin
      .from("rpvm_users")
      .select("student_id")
      .eq("student_id", data.studentId)
      .maybeSingle();
    if (existing) return { ok: false, error: "Student ID already registered" };
    const { data: row, error } = await supabaseAdmin
      .from("rpvm_users")
      .insert({ student_id: data.studentId, name: data.name, bottle_points: 0 })
      .select("student_id, name, bottle_points")
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "Failed to create account" };
    return { ok: true, user: { studentId: row.student_id, name: row.name, bottlePoints: row.bottle_points } };
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId: string }) =>
    z.object({ studentId: studentIdSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> => {
    const { data: row } = await supabaseAdmin
      .from("rpvm_users")
      .select("student_id, name, bottle_points")
      .eq("student_id", data.studentId)
      .maybeSingle();
    if (!row) return { ok: false, error: "Student ID not registered" };
    return { ok: true, user: { studentId: row.student_id, name: row.name, bottlePoints: row.bottle_points } };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId: string }) =>
    z.object({ studentId: studentIdSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<{ user: RpvmUser; transactions: RpvmTransaction[] } | null> => {
    const [{ data: userRow }, { data: txRows }] = await Promise.all([
      supabaseAdmin
        .from("rpvm_users")
        .select("student_id, name, bottle_points")
        .eq("student_id", data.studentId)
        .maybeSingle(),
      supabaseAdmin
        .from("rpvm_transactions")
        .select("id, amount, type, created_at")
        .eq("student_id", data.studentId)
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
  });

export const depositBottles = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId: string; amount?: number }) =>
    z.object({ studentId: studentIdSchema, amount: z.number().int().min(1).max(100).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> => {
    const amount = data.amount ?? 2;
    const { data: row, error } = await supabaseAdmin.rpc("rpvm_deposit", {
      p_student_id: data.studentId,
      p_amount: amount,
    });
    if (error || !row) return { ok: false, error: error?.message ?? "Deposit failed" };
    const r = row as { student_id: string; name: string; bottle_points: number };
    return { ok: true, user: { studentId: r.student_id, name: r.name, bottlePoints: r.bottle_points } };
  });

export const withdrawPaper = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId: string; sheets: number }) =>
    z.object({ studentId: studentIdSchema, sheets: z.number().int().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; user: RpvmUser } | { ok: false; error: string }> => {
    const { data: row, error } = await supabaseAdmin.rpc("rpvm_withdraw", {
      p_student_id: data.studentId,
      p_sheets: data.sheets,
    });
    if (error || !row) return { ok: false, error: error?.message ?? "Insufficient points" };
    const r = row as { student_id: string; name: string; bottle_points: number };
    return { ok: true, user: { studentId: r.student_id, name: r.name, bottlePoints: r.bottle_points } };
  });