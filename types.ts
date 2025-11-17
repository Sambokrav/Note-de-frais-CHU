export const expenseCategories = [
  'Transport', 
  'Hébergement', 
  'Repas', 
  'Frais de conférence', 
  'Péage', 
  'Carburant', 
  'Parking',
  'Frais d\'expertise',
  'Autre'
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export interface Expense {
  id: string;
  date: string;
  amount: number;
  type: string;
  file: File;
}

export interface RibData {
  iban: string;
  bic: string;
}

export interface ProfileData {
  title: string;
  lastName: string;
  firstName: string;
  rpps: string;
  email: string;
  rib?: RibData;
}

export type ReportType = 'frais' | 'debit';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}