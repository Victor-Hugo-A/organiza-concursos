import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  errors: unknown[];

  constructor(status: number, message: string, errors: unknown[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function ok<T>(data: T, message = "Operação realizada com sucesso.", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function created<T>(data: T, message = "Registro criado com sucesso.") {
  return ok(data, message, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(message = "Não foi possível concluir a operação.", status = 400, errors: unknown[] = []) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      success: false,
      message: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
      errors: [],
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status, error.errors);
  }

  if (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "ZodError") {
    return fail("Dados inválidos.", 400, [(error as { flatten?: () => unknown }).flatten?.() ?? error]);
  }

  console.error("Erro inesperado", error);
  return fail("Erro interno do servidor.", 500);
}
