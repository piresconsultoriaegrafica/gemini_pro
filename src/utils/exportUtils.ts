import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        cell = String(cell).replace(/"/g, '""');
        return `"${cell}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportToExcel = async (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dados');

  // Extract headers
  const headers = Object.keys(data[0]);

  // Add header row
  const headerRow = worksheet.addRow(headers);

  // Style header row
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo 600
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });

  // Add data rows
  data.forEach((item, index) => {
    const row = worksheet.addRow(Object.values(item));
    
    // Alternate row colors
    const isEven = index % 2 === 0;
    
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' } // Gray 50 / White
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Enable auto filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = async (title: string, headers: string[], data: any[][], filename: string, companyInfo?: any) => {
  const doc = new jsPDF();
  
  let startY = 30;

  if (companyInfo) {
    let y = 22;
    
    if (companyInfo.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = companyInfo.logoUrl;
        });
        
        // Calculate dimensions to fit within a reasonable box (e.g., 30x30 mm)
        const maxDim = 30;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          h = (h * maxDim) / w;
          w = maxDim;
        } else {
          w = (w * maxDim) / h;
          h = maxDim;
        }
        
        doc.addImage(img, 'PNG', 14, 10, w, h);
        y = 10 + h + 10;
      } catch (error) {
        console.error('Error loading logo for PDF:', error);
      }
    }

    doc.setFontSize(20);
    doc.text(companyInfo.name, 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.text(`CNPJ: ${companyInfo.cnpj} | Tel: ${companyInfo.phone}`, 14, y);
    y += 6;
    doc.text(companyInfo.address, 14, y);
    y += 6;
    
    if (companyInfo.branches && companyInfo.branches.length > 0) {
      doc.text('Filiais:', 14, y);
      y += 6;
      companyInfo.branches.forEach((b: any) => {
        doc.text(`${b.name}: ${b.address}`, 14, y);
        y += 6;
      });
    }
    
    y += 10;
    doc.setFontSize(16);
    doc.text(title, 14, y);
    startY = y + 10;
  } else {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
  }
  
  autoTable(doc, {
    startY,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }
  });
  
  doc.save(`${filename}.pdf`);
};
