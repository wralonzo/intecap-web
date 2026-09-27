/**
 * Utilidades de Exportación a Excel/CSV y PDF para Reportes INTECAP
 */

export function exportToCsv(arg1: any, arg2?: any, arg3?: string[]): void {
  let filename = 'reporte_intecap';
  let rows: any[][] = [];
  let headers: string[] = [];

  if (typeof arg1 === 'string') {
    filename = arg1;
    rows = arg2 || [];
    headers = arg3 || [];
  } else if (Array.isArray(arg1)) {
    filename = typeof arg2 === 'string' ? arg2 : 'reporte_intecap';
    if (arg1.length > 0 && typeof arg1[0] === 'object' && !Array.isArray(arg1[0])) {
      headers = Object.keys(arg1[0]);
      rows = arg1.map((item) => headers.map((h) => item[h]));
    } else {
      rows = arg1;
      headers = arg3 || [];
    }
  }

  const content: string[] = [];

  if (headers && headers.length > 0) {
    content.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));
  }

  for (const row of rows) {
    const line = row.map((cell) => {
      if (cell === null || cell === undefined) return '""';
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(',');
    content.push(line);
  }

  // BOM para que Microsoft Excel reconozca caracteres en español y UTF-8
  const blob = new Blob(['\uFEFF' + content.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printHtmlReport(title: string, tableHtml: string, subtitle?: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite las ventanas emergentes para generar el reporte impreso/PDF.');
    return;
  }

  const now = new Date().toLocaleString('es-GT', { dateStyle: 'full', timeStyle: 'short' });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title} - INTECAP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 2rem; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #002F6C; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .logo-text { font-size: 1.5rem; font-weight: 800; color: #002F6C; letter-spacing: -0.5px; }
        .logo-text span { color: #FDB813; }
        .report-title { font-size: 1.25rem; font-weight: 700; color: #001A3D; margin-top: 0.25rem; }
        .meta { font-size: 0.75rem; color: #64748b; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; font-size: 0.75rem; color: #94a3b8; text-align: center; }
        @media print {
          body { margin: 1cm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo-text">INTECAP<span>.GT</span></div>
          <div class="report-title">${title}</div>
          ${subtitle ? `<div style="color: #64748b; font-size: 11px;">${subtitle}</div>` : ''}
        </div>
        <div class="meta">
          <div><strong>Fecha de emisión:</strong> ${now}</div>
          <div>Sistema de Gestión Integral</div>
        </div>
      </div>

      <div class="content">
        ${tableHtml}
      </div>

      <div class="footer">
        Documento generado automáticamente por el Sistema de Información y Control INTECAP.
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
