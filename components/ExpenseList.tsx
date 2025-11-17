
import React from 'react';
import { Expense, expenseCategories, ExpenseCategory } from '../types';
import { Spinner } from './Spinner';

interface ExpenseListProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
  processingFiles: File[];
  onUpdateCategory: (id: string, category: string) => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);


export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onRemove, processingFiles, onUpdateCategory }) => {
  if (expenses.length === 0 && processingFiles.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
        <FileIcon />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun justificatif ajouté</h3>
        <p className="mt-1 text-sm text-gray-500">Vos justificatifs apparaîtront ici une fois analysés.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <ul role="list" className="divide-y divide-gray-200">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
               <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {expense.file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(expense.file)} alt="Aperçu" className="h-full w-full object-cover" />
                    ) : (
                        <FileIcon/>
                    )}
                </div>
              <div className="flex-1 min-w-0">
                 <select
                    value={expense.type}
                    onChange={(e) => onUpdateCategory(expense.id, e.target.value)}
                    className="block w-full rounded-md border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 sm:text-sm bg-transparent p-0 -ml-1 text-sm font-medium text-gray-900 truncate"
                    aria-label={`Catégorie pour la dépense du ${new Date(expense.date).toLocaleDateString('fr-FR')}`}
                  >
                    {!expenseCategories.includes(expense.type as ExpenseCategory) && expense.type && (
                      <option value={expense.type} disabled>{expense.type} (suggéré)</option>
                    )}
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                <p className="text-sm text-gray-500 truncate">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <p className="text-sm font-semibold text-gray-900">{expense.amount.toFixed(2)} €</p>
              <button
                onClick={() => onRemove(expense.id)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
         {processingFiles.map((file) => (
            <li key={file.name + file.lastModified} className="flex items-center justify-between p-4 bg-blue-50 opacity-75">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10">
                        <Spinner />
                    </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Analyse en cours...</p>
                        <p className="text-sm text-gray-500 truncate">{file.name}</p>
                    </div>
                </div>
            </li>
         ))}
      </ul>
    </div>
  );
};