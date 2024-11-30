import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportOptions {
  fileName?: string;
  title?: string;
  description?: string;
  includeTimestamp?: boolean;
  filterDescription?: string;
}

const defaultOptions: ExportOptions = {
  fileName: 'health_data_export',
  includeTimestamp: true,
};

// Helper to format data for export
const formatDataForExport = (data: any[]) => {
  return data.map(item => ({
    ...item,
    lastVisit: item.lastVisit ? format(new Date(item.lastVisit), 'yyyy-MM-dd') : '',
    createdAt: item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm') : '',
  }));
};

// Export to CSV
export const exportToCSV = (data: any[], options: ExportOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  const formattedData = formatDataForExport(data);
  
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Data');

  const timestamp = opts.includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  const fileName = `${opts.fileName}${timestamp}.csv`;
  
  XLSX.writeFile(workbook, fileName);
};

// Export to Excel
export const exportToExcel = (data: any[], options: ExportOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  const formattedData = formatDataForExport(data);
  
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Data');

  const timestamp = opts.includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  const fileName = `${opts.fileName}${timestamp}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

// Export to PDF
export const exportToPDF = (data: any[], options: ExportOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  const formattedData = formatDataForExport(data);
  
  const doc = new jsPDF();
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  // Add title
  if (opts.title) {
    doc.setFontSize(16);
    doc.text(opts.title, 14, 20);
  }

  // Add filter description if provided
  if (opts.filterDescription) {
    doc.setFontSize(10);
    doc.text(`Filters: ${opts.filterDescription}`, 14, 30);
  }

  // Add timestamp
  if (opts.includeTimestamp) {
    doc.setFontSize(10);
    doc.text(`Generated: ${timestamp}`, 14, opts.filterDescription ? 40 : 30);
  }

  // Convert data to table format
  const headers = Object.keys(formattedData[0]);
  const rows = formattedData.map(item => Object.values(item));

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: opts.filterDescription ? 45 : 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  const pdfTimestamp = opts.includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  const fileName = `${opts.fileName}${pdfTimestamp}.pdf`;
  
  doc.save(fileName);
};

// Main export function that handles all formats
export const exportData = (
  data: any[],
  format: 'csv' | 'excel' | 'pdf',
  options: ExportOptions = {}
) => {
  switch (format) {
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'excel':
      exportToExcel(data, options);
      break;
    case 'pdf':
      exportToPDF(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
