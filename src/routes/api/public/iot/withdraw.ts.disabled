import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Body = z.object({
  student_id: z.string().regex(/^[0-9]{10}$/),
  sheets: z.number().int().min(1).max(50),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-device-secret",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export const Route = createFileRoute("/api/public/iot/withdraw")({
  server: {
    handlers: {
      OPTIONS: async () => json({}, 204),
      POST: async ({ request }) => {
        const secret = request.headers.get("x-device-secret");
        if (!secret || secret !== process.env.IOT_DEVICE_SECRET) {
          return json({ error: "Unauthorized" }, 401);
        }
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) return json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

        const { data: row, error } = await supabaseAdmin.rpc("rpvm_withdraw", {
          p_student_id: parsed.data.student_id,
          p_sheets: parsed.data.sheets,
        });
        if (error || !row) return json({ error: error?.message ?? "Insufficient points" }, 400);
        const r = row as { student_id: string; name: string; bottle_points: number };
        return json({
          ok: true,
          student_id: r.student_id,
          name: r.name,
          bottle_points: r.bottle_points,
          sheets: parsed.data.sheets,
          cost: parsed.data.sheets * 2,
        });
      },
    },
  },
});