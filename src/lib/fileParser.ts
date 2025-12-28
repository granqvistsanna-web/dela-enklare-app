import * as ExcelJS from "exceljs";

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  isShared?: boolean;
  selected?: boolean;
}

// --- Public API --------------------------------------------------------------

// Parses CSV and "Excel" exports from Swedish banks.
// Banks often export for readability (blank rows, unnamed columns, header not on first row).
export async function parseFile(content: string | ArrayBuffer, fileName: string): Promise<ParsedTransaction[]> {
  const name = fileName.toLowerCase();
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

  if (isExcel) {
    // 1) Real Excel (binary)
    if (content instanceof ArrayBuffer) {
      try {
        return await parseExcelArrayBuffer(content);
      } catch (err) {
        console.error("Excel parsing failed (arrayBuffer):", err);
        // Fall through: many banks ship HTML/CSV with .xls extension.
        return [];
      }
    }

    // 2) Sometimes .xls is actually HTML/CSV text
    if (typeof content === "string") {
      const excelResult = await parseExcelText(content);
      return excelResult || parseCSV(content);
    }

    return [];
  }

  // CSV (or any text export)
  if (typeof content === "string") return parseCSV(content);
  return [];
}

// --- Excel -------------------------------------------------------------------

async function parseExcelArrayBuffer(buffer: ArrayBuffer): Promise<ParsedTransaction[]> {
  // NOTE: If the file isn't a real zip/xlsx, ExcelJS will throw an error.
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return parseWorkbook(workbook);
}

async function parseExcelText(text: string): Promise<ParsedTransaction[] | null> {
  const trimmed = text.trimStart();

  // Heuristic: HTML exports often begin with '<' or contain '<table'
  const looksLikeHtml = trimmed.startsWith("<") && /<table/i.test(trimmed);
  if (!looksLikeHtml) return null;

  try {
    // For HTML tables, we'll parse as CSV instead since ExcelJS doesn't handle HTML well
    // Fall back to CSV parsing for HTML content
    return null;
  } catch (err) {
    console.error("Excel parsing failed (html/text):", err);
    return null;
  }
}

function parseWorkbook(workbook: ExcelJS.Workbook): ParsedTransaction[] {
  const worksheet = workbook.worksheets?.[0];
  if (!worksheet) return [];

  // Convert ExcelJS worksheet to 2D array: rows x cols
  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Get cell value as string, handle various cell types
      let value = "";
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === "object" && "text" in cell.value) {
          value = cell.value.text;
        } else if (cell.value instanceof Date) {
          value = cell.value.toISOString().split("T")[0];
        } else {
          value = cell.value.toString();
        }
      }
      rowValues[colNumber - 1] = value;
    });
    rows.push(rowValues);
  });

  return parseTable(rows);
}

// --- CSV ---------------------------------------------------------------------

export function parseCSV(content: string): ParsedTransaction[] {
  const normalized = content.replace(/^\uFEFF/, ""); // strip BOM
  const linesAll = normalized.split(/\r?\n/).map((l) => l.trim());

  // Drop leading/trailing empty lines
  const lines = linesAll.filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter from the first non-empty line
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  // Parse into table first (more robust than header-first approach)
  const table = lines.map((line) => parseCSVLine(line, delimiter));
  return parseTable(table);
}

// --- Shared parsing (table -> transactions) ----------------------------------

function parseTable(rawRows: string[][]): ParsedTransaction[] {
  // Remove fully empty rows
  const rows = rawRows
    .map((r) => r.map((c) => (c ?? "").toString().replace(/^"|"$/g, "").trim()))
    .filter((r) => r.some((c) => c && c.trim().length > 0));

  if (rows.length < 2) return [];

  const headerRowIndex = findHeaderRowIndex(rows);
  const header = rows[headerRowIndex] ?? [];
  const dataRows = rows.slice(headerRowIndex + 1);

  const { dateCol, amountCol, descCol } = inferColumns(header, dataRows);
  if (dateCol == null || amountCol == null) return [];

  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const dateStr = r[dateCol] ?? "";
    const amountStr = r[amountCol] ?? "";

    const date = parseSwedishDate(dateStr);
    if (!date) continue;

    const amount = parseSwedishAmount(amountStr);
    if (!amount || Number.isNaN(amount)) continue;

    const description = (r[descCol ?? -1] ?? "").toString().trim();
    if (!description) continue;

    // Keep both + and - amounts; user can deselect in review.
    transactions.push({
      id: `${headerRowIndex + 1 + i}-${Date.now()}`,
      date,
      description,
      amount: Math.abs(amount),
      selected: true,
      isShared: true,
    });
  }

  return transactions;
}

function findHeaderRowIndex(rows: string[][]): number {
  // Scan first 30 rows for something that looks like a header
  const maxScan = Math.min(rows.length, 30);
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < maxScan; i++) {
    const cells = rows[i].map((c) => c.toLowerCase());
    const score =
      containsAny(cells, ["datum", "date", "bokför", "transaktions"]) ? 2 : 0 +
      (containsAny(cells, ["belopp", "amount", "summa", "debet", "kredit"]) ? 2 : 0) +
      (containsAny(cells, ["beskriv", "text", "mottag", "rubrik", "meddel"]) ? 1 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // If we found nothing that looks like a header, assume first row is header.
  return bestScore <= 0 ? 0 : bestIdx;
}

function inferColumns(header: string[], dataRows: string[][]): {
  dateCol: number | null;
  amountCol: number | null;
  descCol: number | null;
} {
  // 1) Try header-based indices
  const headerLower = header.map((h) => (h ?? "").toString().toLowerCase());

  const dateColHeader = headerLower.findIndex((h) =>
    ["datum", "date", "bokföringsdag", "transaktionsdatum"].some((k) => h.includes(k))
  );
  const amountColHeader = headerLower.findIndex((h) =>
    ["belopp", "amount", "summa", "debet", "kredit"].some((k) => h.includes(k))
  );
  const descColHeader = headerLower.findIndex((h) =>
    ["beskrivning", "text", "mottagare", "description", "meddelande", "rubrik"].some((k) => h.includes(k))
  );

  const sample = dataRows.slice(0, 25);
  const colCount = Math.max(...[header.length, ...sample.map((r) => r.length)]);

  // 2) If missing, infer from content
  const dateCol = dateColHeader >= 0 ? dateColHeader : inferDateColumn(sample, colCount);
  const amountCol = amountColHeader >= 0 ? amountColHeader : inferAmountColumn(sample, colCount);

  let descCol = descColHeader >= 0 ? descColHeader : inferDescriptionColumn(sample, colCount, [dateCol, amountCol]);
  if (descCol == null) descCol = 1; // fallback

  return {
    dateCol: dateCol ?? null,
    amountCol: amountCol ?? null,
    descCol,
  };
}

function inferDateColumn(rows: string[][], colCount: number): number | null {
  let bestCol: number | null = null;
  let bestScore = 0;

  for (let c = 0; c < colCount; c++) {
    let score = 0;
    for (const r of rows) {
      const v = (r[c] ?? "").toString();
      if (parseSwedishDate(v)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }

  return bestScore >= 2 ? bestCol : null;
}

function inferAmountColumn(rows: string[][], colCount: number): number | null {
  let bestCol: number | null = null;
  let bestScore = 0;

  for (let c = 0; c < colCount; c++) {
    let score = 0;
    for (const r of rows) {
      const v = (r[c] ?? "").toString();
      const n = parseSwedishAmount(v);
      if (!Number.isNaN(n) && n !== 0) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }

  return bestScore >= 2 ? bestCol : null;
}

function inferDescriptionColumn(rows: string[][], colCount: number, exclude: Array<number | null>): number | null {
  let bestCol: number | null = null;
  let bestScore = 0;

  for (let c = 0; c < colCount; c++) {
    if (exclude.includes(c)) continue;

    let score = 0;
    for (const r of rows) {
      const v = (r[c] ?? "").toString().trim();
      if (v && v.length >= 3 && !parseSwedishDate(v) && Number.isNaN(parseSwedishAmount(v))) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }

  return bestScore >= 2 ? bestCol : null;
}

function containsAny(cells: string[], needles: string[]): boolean {
  return cells.some((c) => needles.some((n) => c.includes(n)));
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseSwedishAmount(str: string): number {
  const s = (str ?? "").toString().trim();
  if (!s) return NaN;

  // Handle parentheses for negative (e.g. (123,45))
  const isParensNeg = /^\(.*\)$/.test(s);

  const cleaned = s
    .replace(/^\(|\)$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return NaN;
  return isParensNeg ? -n : n;
}

function parseSwedishDate(str: string): string | null {
  const s = (str ?? "").toString().trim();
  if (!s) return null;

  // Common formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})(\d{2})(\d{2})$/, // YYYYMMDD
  ];

  for (const format of formats) {
    const match = s.match(format);
    if (match) {
      let year: string, month: string, day: string;

      if (format === formats[0]) {
        [, year, month, day] = match;
      } else if (format === formats[1] || format === formats[2]) {
        [, day, month, year] = match;
      } else {
        [, year, month, day] = match;
      }

      return `${year}-${month}-${day}`;
    }
  }

  // Try ISO-ish or Date parsing
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {
    // ignore
  }

  return null;
}
