"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadIcon, FileTextIcon, CheckIcon, AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Select } from "@/components/ui/Select";
import { offlineAction } from "@/lib/offline";

const EASE = [0.23, 1, 0.32, 1] as const;

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ImportContentProps {
  accounts: Account[];
  categories: Category[];
}

type Step = "upload" | "map" | "preview" | "done";

interface ParsedColumn {
  index: number;
  header: string;
  sample: string;
}

interface ParsedRow {
  [key: string]: string;
}

const COMMON_DATE_FORMATS = [
  "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD",
  "M/D/YYYY", "D/M/YYYY", "YYYY/MM/DD",
];

const FIELD_OPTIONS = [
  { key: "skip", label: "Skip column" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "description", label: "Description" },
  { key: "type", label: "Type (income/expense)" },
  { key: "category", label: "Category" },
  { key: "account", label: "Account name" },
] as const;

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter((r) => r.some((cell) => cell));

  return { headers, rows };
}

function guessType(headers: string[]): Record<string, string> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const mapping: Record<string, string> = {};

  lower.forEach((h, i) => {
    if (/date|transdate|posted/i.test(h)) mapping[headers[i]] = "date";
    else if (/amount|value|sum|total|credit|debit/i.test(h)) mapping[headers[i]] = "amount";
    else if (/desc|note|memo|payee|details|narrative|transaction/i.test(h)) mapping[headers[i]] = "description";
    else if (/type|cate|classification/i.test(h)) mapping[headers[i]] = "type";
    else if (/category|cat/i.test(h)) mapping[headers[i]] = "category";
    else if (/account|acct/i.test(h)) mapping[headers[i]] = "account";
  });

  return mapping;
}

function parseAmount(val: string): number {
  const cleaned = val
    .replace(/^[₱$€£¥]/, "")
    .replace(/[,\s]/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function detectType(row: Record<string, string>): "income" | "expense" | "transfer" {
  const vals = Object.values(row).join(" ").toLowerCase();
  if (/income|deposit|credit|salary|earned|inflow|receipt/i.test(vals)) return "income";
  if (/expense|debit|payment|purchase|withdrawal|outflow|spent/i.test(vals)) return "expense";
  if (/transfer/i.test(vals)) return "transfer";

  const amountStr = Object.values(row).join(" ");
  const amount = parseAmount(amountStr);
  if (amount < 0) return "expense";
  return "expense";
}

export function ImportContent({ accounts, categories }: ImportContentProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ row: number; status: string; message?: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedColumns: ParsedColumn[] = useMemo(
    () =>
      headers.map((header, i) => ({
        index: i,
        header,
        sample: rawRows[0]?.[i] ?? "",
      })),
    [headers, rawRows]
  );

  const previewRows = useMemo(() => {
    return rawRows.slice(0, 10).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });
  }, [rawRows, headers]);

  function handleFile(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text);

        setHeaders(parsedHeaders);
        setRawRows(parsedRows);

        const guessed = guessType(parsedHeaders);
        const map: Record<string, string> = {};
        parsedHeaders.forEach((h) => {
          map[h] = guessed[h] ?? "skip";
        });

        if (!Object.values(map).includes("date")) {
          const dateCol = parsedHeaders.find((_, i) => i < 3);
          if (dateCol) map[dateCol] = "date";
        }
        if (!Object.values(map).includes("amount")) {
          const amountCol = parsedHeaders.find(
            (_, i) => i < 3 && map[parsedHeaders[i]] === "skip"
          );
          if (amountCol) map[amountCol] = "amount";
        }

        setFieldMap(map);
        setStep("map");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function isMappingValid() {
    const assigned = Object.values(fieldMap);
    return (
      assigned.includes("date") &&
      assigned.includes("amount") &&
      assigned.includes("account")
    );
  }

  const createImportTransactions = offlineAction("createImportTransactions");

  async function handleImport() {
    if (!selectedAccount) return;
    setImporting(true);
    setError(null);

    const inverseMap: Record<string, string> = {};
    Object.entries(fieldMap).forEach(([header, field]) => {
      inverseMap[field] = header;
    });

    const dateHeader = inverseMap["date"];
    const amountHeader = inverseMap["amount"];
    const descHeader = inverseMap["description"];
    const typeHeader = inverseMap["type"];
    const catHeader = inverseMap["category"];
    const accountHeader = inverseMap["account"];

    const rows = rawRows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });

    const importRows = rows.map((row) => {
      const type = typeHeader
        ? (row[typeHeader]?.toLowerCase().includes("income") ||
          row[typeHeader]?.toLowerCase().includes("credit") ||
          row[typeHeader]?.toLowerCase().includes("deposit")
          ? "income"
          : row[typeHeader]?.toLowerCase().includes("transfer")
            ? "transfer"
            : "expense")
        : detectType(row);

      return {
        date: dateHeader ? row[dateHeader] : "",
        amount: parseAmount(amountHeader ? row[amountHeader] : "0"),
        description: descHeader ? row[descHeader] : "",
        type,
        categoryName: catHeader ? row[catHeader] : undefined,
        accountName: accountHeader ? row[accountHeader] : (accounts.find((a) => a.id === selectedAccount)?.name ?? ""),
      };
    });

    try {
      const res = await createImportTransactions(importRows);
      setResults(res);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const summary = results
    ? {
        ok: results.filter((r) => r.status === "ok").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        error: results.filter((r) => r.status === "error").length,
      }
    : null;

  return (
    <div>
      <PageHeading
        eyebrow="Data"
        title="Import CSV"
        action={
          step !== "upload" && (
            <button
              onClick={() => setStep("upload")}
              className="pressable inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[13px] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
            >
              <ArrowLeftIcon size={16} strokeWidth={1.75} />
              <span>Back</span>
            </button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-card border-2 border-dashed border-line bg-paper-0 px-6 py-16 text-center transition-colors hover:border-brand-500"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50">
                <UploadIcon size={24} className="text-brand-600" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-medium text-ink-900">
                Drop your CSV here
              </p>
              <p className="mt-1 text-[13px] text-ink-400">
                or click to browse
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
            </div>

            <div className="mt-6 rounded-card border border-hair border-line bg-paper-0 px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Expected format
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-50 p-3 font-mono text-[12px] text-ink-700">
{`date,amount,description,type,category,account
2024-01-15,150.00,Salary,income,Salary,GCash
2024-01-16,45.00,Groceries,expense,Food,GCash`}
              </pre>
              <p className="mt-2 text-[12px] text-ink-400">
                Column names will be auto-detected. You can adjust the mapping in the next step.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg bg-warning-50 px-4 py-3 text-[13px] text-warning-700"
              >
                {error}
              </motion.div>
            )}
          </motion.div>
        )}

        {step === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-5"
          >
            <div className="rounded-card border border-hair border-line bg-paper-0 px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Assign columns
              </p>
              <p className="mt-1 text-[13px] text-ink-400">
                Map each CSV column to a field. {rawRows.length} rows detected.
              </p>
              <div className="mt-3 space-y-2.5">
                {parsedColumns.map((col) => (
                  <div
                    key={col.index}
                    className="flex items-center gap-3 rounded-lg border border-hair border-line px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink-900">
                        {col.header}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        e.g. {col.sample}
                      </p>
                    </div>
                    <Select
                      value={fieldMap[col.header] ?? "skip"}
                      onChange={(v) =>
                        setFieldMap((prev) => ({ ...prev, [col.header]: v }))
                      }
                      options={FIELD_OPTIONS.map((opt) => ({
                        value: opt.key,
                        label: opt.label,
                      }))}
                      buttonClassName="w-36 shrink-0 rounded-lg px-2.5 py-1.5 text-[12px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-hair border-line bg-paper-0 px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Default account
              </p>
              <p className="mt-1 text-[13px] text-ink-400">
                Used when no account column is mapped, or as fallback.
              </p>
              <Select
                value={selectedAccount}
                onChange={setSelectedAccount}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: a.name,
                }))}
                className="mt-2"
              />
            </div>

            <div className="rounded-card border border-hair border-line bg-paper-0 px-5 py-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Preview
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-hair border-line">
                      <th className="py-1.5 pr-3 font-medium text-ink-500">#</th>
                      {Object.entries(fieldMap)
                        .filter(([, v]) => v !== "skip")
                        .map(([header]) => (
                          <th key={header} className="px-2 py-1.5 font-medium text-ink-500">
                            {fieldMap[header]}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-hair border-line last:border-0">
                        <td className="py-1.5 pr-3 text-ink-400">{i + 1}</td>
                        {Object.entries(fieldMap)
                          .filter(([, v]) => v !== "skip")
                          .map(([header]) => (
                            <td key={header} className="max-w-[120px] truncate px-2 py-1.5 text-ink-900">
                              {row[header]}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rawRows.length > 10 && (
                <p className="mt-2 text-[11px] text-ink-400">
                  Showing first 10 of {rawRows.length} rows
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700">
                {error}
              </p>
            )}

            <button
              onClick={handleImport}
              disabled={!isMappingValid() || importing}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-[15px] font-medium text-paper-0 transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {importing && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {importing ? "Importing…" : `Import ${rawRows.length} transaction${rawRows.length !== 1 ? "s" : ""}`}
            </button>
          </motion.div>
        )}

        {step === "done" && summary && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-5"
          >
            <div className="rounded-card border border-hair border-line bg-paper-0 px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-positive-50">
                <CheckIcon size={22} className="text-positive-600" strokeWidth={2.5} />
              </div>
              <p className="text-[16px] font-medium text-ink-900">
                Import complete
              </p>
              <div className="mt-4 flex justify-center gap-6">
                <div className="text-center">
                  <p className="font-display text-[24px] font-medium text-positive-700">
                    {summary.ok}
                  </p>
                  <p className="text-[12px] text-ink-400">Imported</p>
                </div>
                {(summary.skipped > 0 || summary.error > 0) && (
                  <>
                    <div className="text-center">
                      <p className="font-display text-[24px] font-medium text-warning-700">
                        {summary.skipped}
                      </p>
                      <p className="text-[12px] text-ink-400">Skipped</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-[24px] font-medium text-warning-700">
                        {summary.error}
                      </p>
                      <p className="text-[12px] text-ink-400">Errors</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {(summary.skipped > 0 || summary.error > 0) && (
              <div className="rounded-card border border-hair border-line bg-paper-0 px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                  Details
                </p>
                <div className="mt-2 space-y-1">
                  {results
                    ?.filter((r) => r.status !== "ok")
                    .slice(0, 20)
                    .map((r, i) => (
                      <p key={i} className="text-[12px] text-ink-600">
                        Row {r.row}:{" "}
                        <span className={r.status === "error" ? "text-warning-700" : "text-ink-400"}>
                          {r.message ?? r.status}
                        </span>
                      </p>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setStep("upload");
                setResults(null);
                setError(null);
              }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-[15px] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
            >
              Import another file
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
