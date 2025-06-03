// src/services/exportService.ts
import { Transaction } from '../types';

const escapeCSVField = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) {
        return '';
    }
    const stringField = String(field);
    // If the field contains a comma, double quote, or newline, enclose it in double quotes
    // and escape existing double quotes by doubling them (RFC 4180)
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};


export const convertTransactionsToCSV = (transactions: Transaction[]): string => {
  const header = ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'Tags'];
  
  const rows = transactions.map(tx => [
    escapeCSVField(tx.id),
    escapeCSVField(tx.date),
    escapeCSVField(tx.description),
    tx.amount, // Numbers don't typically need escaping unless they are formatted with commas as part of a string.
    escapeCSVField(tx.type),
    escapeCSVField(tx.category),
    escapeCSVField((tx.tags || []).join(';')) // Using semicolon as an internal separator for tags
  ]);

  const csvContent = [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvString: string, filename: string): void => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers (e.g., IE)
    // This might not work perfectly in all cases or show a prompt.
    if ((navigator as any).msSaveBlob) {
        (navigator as any).msSaveBlob(blob, filename);
    } else {
        // For other very old browsers, you might need to display the CSV data
        // or inform the user to copy it manually.
        alert("Your browser doesn't support automatic CSV download. Please use a modern browser.");
    }
  }
};