import type { CreatedGuest } from "@/components/admin/guests/types";

export function parseGuestNames(value: string) {
  return value
    .split(/[,;\n]+/g)
    .map(name => name.replace(/\s+/g, " ").trim())
    .filter(name => name.length >= 2);
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function downloadGuestCodes(rows: CreatedGuest[], filename = "senhas-convidados.csv") {
  const withCodes = rows.filter(row => row.code);
  if (!withCodes.length) return;
  const csv = ["Nome,Senha", ...withCodes.map(row => `${csvEscape(row.name)},${csvEscape(row.code || "")}`)].join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
