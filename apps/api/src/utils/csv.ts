export function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  // Prevent spreadsheet applications from evaluating user-entered values as formulas.
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function csvRow(values: Array<string | null | undefined>): string {
  return values.map(csvCell).join(',');
}
