import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePdf, PdfAnalysisError } from "../lib/pdf-analysis";
import { isPdf, readMaterialPdf } from "../lib/material-files";

const pdf = Buffer.from("%PDF-1.4\nDocumento de teste");
const context = { materia: "Biologia", objetivo: "ENEM", tipo: "ENEM" };
const valid = {
  legivel: true,
  resumo: "As células possuem estruturas com funções diferentes.",
  pontosEstudo: ["Relacionar as organelas às suas funções."],
  palavrasChave: ["Célula", "célula", "Mitocôndria"],
};
const envelope = (data: unknown) => ({
  status: "completed",
  output: [
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(data) }],
    },
  ],
});

test("análise de PDFs: configuração, contrato da API e falhas recuperáveis", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  });
  await t.test("sem chave não envia documentos", async () => {
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = async () => {
      assert.fail("Não deve haver chamada sem chave");
    };
    await assert.rejects(
      analyzePdf(pdf, "aula.pdf", context),
      /ainda não está disponível/,
    );
  });
  process.env.OPENAI_API_KEY = "chave-ficticia-de-teste";
  process.env.OPENAI_MODEL = "gpt-4.1-mini";
  await t.test(
    "envia PDF e contexto, usa saída estruturada e remove termos duplicados",
    async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        const body = JSON.parse(String(options?.body));
        assert.equal(body.store, false);
        assert.equal(body.text.format.strict, true);
        assert.equal(body.text.format.schema.additionalProperties, false);
        assert.equal(
          body.input[0].content[1].file_data,
          `data:application/pdf;base64,${pdf.toString("base64")}`,
        );
        assert.ok(body.input[0].content[0].text.includes("Biologia"));
        return Response.json(envelope(valid));
      };
      const result = await analyzePdf(pdf, "aula.pdf", context);
      assert.deepEqual(result.palavrasChave, ["célula", "Mitocôndria"]);
      assert.equal(result.resumo, valid.resumo);
    },
  );
  for (const [label, body] of [
    ["resposta incompleta", { status: "incomplete", output: [] }],
    [
      "recusa",
      {
        status: "completed",
        output: [{ content: [{ type: "refusal", refusal: "Não" }] }],
      },
    ],
    ["JSON fora do contrato", envelope({ resumo: "incompleto" })],
    ["PDF ilegível", envelope({ ...valid, legivel: false })],
    ["conteúdo insuficiente", envelope({ ...valid, palavrasChave: [] })],
  ] as const) {
    await t.test(`não salva análise inválida: ${label}`, async () => {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(
        analyzePdf(pdf, "aula.pdf", context),
        PdfAnalysisError,
      );
    });
  }
  await t.test(
    "limite do provedor não expõe a resposta ou credenciais",
    async () => {
      globalThis.fetch = async () =>
        Response.json({ error: "detalhe interno" }, { status: 429 });
      await assert.rejects(
        analyzePdf(pdf, "aula.pdf", context),
        (error: unknown) =>
          error instanceof PdfAnalysisError &&
          !error.message.includes("detalhe interno") &&
          error.message.includes("PDF está salvo"),
      );
    },
  );
  await t.test("falha de rede permite tentar novamente", async () => {
    globalThis.fetch = async () => {
      throw new Error("network");
    };
    await assert.rejects(
      analyzePdf(pdf, "aula.pdf", context),
      /Tente gerar o resumo novamente/,
    );
  });
  await t.test(
    "leitura recusa caminhos de outro usuário e hosts externos sem fazer fetch",
    async () => {
      globalThis.fetch = async () => {
        assert.fail("Não deve buscar origem não autorizada");
      };
      await assert.rejects(
        readMaterialPdf("https://example.com/arquivo.pdf", "user-a"),
      );
      await assert.rejects(
        readMaterialPdf(
          "https://example.public.blob.vercel-storage.com/materiais/user-b/a.pdf",
          "user-a",
        ),
      );
      await assert.rejects(
        readMaterialPdf("/uploads/user-a/../user-b/a.pdf", "user-a"),
      );
      await assert.rejects(
        readMaterialPdf("/uploads/user-a/..\\user-b\\a.pdf", "user-a"),
      );
    },
  );
});

test("validação de arquivo exige assinatura PDF e respeita 4 MB", () => {
  assert.equal(isPdf(pdf), true);
  assert.equal(isPdf(Buffer.from("arquivo renomeado.pdf")), false);
  assert.equal(isPdf(Buffer.alloc(0)), false);
  assert.equal(
    isPdf(Buffer.concat([pdf, Buffer.alloc(4 * 1024 * 1024)])),
    false,
  );
});
