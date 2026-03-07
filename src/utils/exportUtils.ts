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

export const exportToExcel = (data: any[], filename: string) => {
  console.log("exportToExcel called with:", { dataCount: data?.length, filename });
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log("File saved");
  } catch (error) {
    console.error("Error in exportToExcel:", error);
  }
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
