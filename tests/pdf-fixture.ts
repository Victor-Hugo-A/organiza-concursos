import { deflateSync } from "node:zlib";

// Small, valid PDFs with WinAnsi text and compressed streams. No external service.
export function createTextPdf(pages: string[][]) {
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ")}] >>`),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
  ];
  pages.forEach((lines, index) => {
    objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`));
    const content = lines.map((line, lineIndex) => `BT /F1 12 Tf 40 ${790 - lineIndex * 25} Td (${line.replace(/([\\()])/g, "\\$1")}) Tj ET`).join("\n");
    const compressed = deflateSync(Buffer.from(content, "latin1"));
    objects.push(Buffer.concat([Buffer.from(`<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`), compressed, Buffer.from("\nendstream")]));
  });
  const parts = [Buffer.from("%PDF-1.7\n")];
  const offsets = [0];
  let position = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(position);
    const part = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), object, Buffer.from("\nendobj\n")]);
    parts.push(part); position += part.length;
  });
  parts.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`));
  return Buffer.concat(parts);
}
