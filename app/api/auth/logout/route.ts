import { deleteCurrentSession } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  await deleteCurrentSession();
  return ok(null, "Sessão encerrada.");
}
