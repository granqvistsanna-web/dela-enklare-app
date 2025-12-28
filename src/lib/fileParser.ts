import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  isShared?: boolean;
  selected?: boolean;
}

// Common Swedish bank CSV/Excel formats
export function parseFile(content: string | ArrayBuffer, fileName: string): ParsedTransaction[] {
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  if (isExcel && content instanceof ArrayBuffer) {
    return parseExcel(content);
  } else if (typeof content === 'string') {
    return parseCSV(content);
  }
  
  return [];
}

function parseExcel(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to CSV format and parse
  const csvContent = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
  return parseCSV(csvContent);
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  // Parse header
  const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  // Find relevant columns
  const dateIndex = headers.findIndex(h => 
    h.includes('datum') || h.includes('date') || h.includes('bokföringsdag') || h.includes('transaktionsdatum')
  );
  const descIndex = headers.findIndex(h => 
    h.includes('beskrivning') || h.includes('text') || h.includes('mottagare') || 
    h.includes('description') || h.includes('meddelande') || h.includes('rubrik')
  );
  const amountIndex = headers.findIndex(h => 
    h.includes('belopp') || h.includes('amount') || h.includes('summa') || h.includes('saldo')
  );

  // Fallback to position-based if headers not found
  const dIdx = dateIndex >= 0 ? dateIndex : 0;
  const descIdx = descIndex >= 0 ? descIndex : 1;
  const amtIdx = amountIndex >= 0 ? amountIndex : 2;

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line handling quoted values
    const values = parseCSVLine(line, delimiter);
    
    if (values.length <= Math.max(dIdx, descIdx, amtIdx)) continue;

    const dateStr = values[dIdx]?.replace(/"/g, '').trim() || '';
    const description = values[descIdx]?.replace(/"/g, '').trim() || '';
    const amountStr = values[amtIdx]?.replace(/"/g, '').trim() || '0';

    // Parse amount (Swedish format: 1 234,56)
    const amount = parseSwedishAmount(amountStr);
    
    // Skip income (positive amounts) unless they look like refunds
    if (amount <= 0) continue;

    // Parse date (various Swedish formats)
    const date = parseSwedishDate(dateStr);
    if (!date) continue;

    transactions.push({
      id: `${i}-${Date.now()}`,
      date,
      description,
      amount: Math.abs(amount),
      selected: true,
      isShared: true,
    });
  }

  return transactions;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function parseSwedishAmount(str: string): number {
  // Remove spaces, replace comma with dot
  const cleaned = str
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Decimal separator
  
  return parseFloat(cleaned) || 0;
}

function parseSwedishDate(str: string): string | null {
  // Try various formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, etc.
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})(\d{2})(\d{2})$/, // YYYYMMDD
  ];

  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      let year, month, day;
      
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

  // Try to parse as Date
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore
  }

  return null;
}
