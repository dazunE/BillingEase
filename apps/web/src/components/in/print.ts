/** Print styles for invoice pages: only the invoice sheet goes on paper. */
export const PRINT_CSS = `
@page { margin: 16mm; }
@media print {
  html, body, body > div { background: #fff !important; min-height: 0 !important; }
  body > div > header, [role="status"] { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  .print-sheet { border: 0 !important; border-radius: 0 !important; padding: 0 !important; }
  a { text-decoration: none !important; }
}
`;
