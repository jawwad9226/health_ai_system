import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export const exportToCSV = (data, filename) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Health Data');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = async (data, filename) => {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF();
  const tableColumn = Object.keys(data[0]);
  const tableRows = data.map(item => Object.values(item));
  
  doc.text('Health Data Report', 14, 15);
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });
  
  doc.save(`${filename}.pdf`);
};

const convertToCSV = (data) => {
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

export const prepareHealthDataForExport = (healthData) => {
  return healthData.map(record => ({
    Date: new Date(record.date).toLocaleDateString(),
    'Blood Pressure': record.blood_pressure,
    'Heart Rate': record.heart_rate,
    'BMI': record.bmi,
    'Risk Score': record.risk_scores?.overall || 'N/A',
    'Recommendations': record.recommendations?.join(', ') || 'N/A'
  }));
};
