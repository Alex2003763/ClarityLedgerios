import React, { useState, useEffect, useCallback } from 'react';
import { RecurringTransaction, TransactionType, RecurringFrequency } from '../../types';
import { 
  getRecurringTransactions, 
  addRecurringTransaction, 
  updateRecurringTransaction, 
  deleteRecurringTransaction 
} from '../../services/recurringTransactionService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useAppContext } from '../../contexts/AppContext';
import RecurringTransactionForm from '../recurring/RecurringTransactionForm';
import RecurringTransactionList from '../recurring/RecurringTransactionList';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-plus ${className || "w-4 h-4"}`}></i>
);
const SyncAltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-sync-alt ${className || "w-6 h-6"}`}></i>
);


const RecurringTransactionsPage: React.FC = () => {
  const { t } = useAppContext();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  const fetchRecurringTransactions = useCallback(() => {
    setIsLoading(true);
    const data = getRecurringTransactions();
    // Sort by nextDueDate, then by description
    data.sort((a, b) => {
        const dateComparison = new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.description.localeCompare(b.description);
    });
    setRecurringTransactions(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const handleOpenModal = (transaction?: RecurringTransaction) => {
    setEditingTransaction(transaction || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleSubmitForm = (data: Omit<RecurringTransaction, 'id' | 'userId' | 'nextDueDate' | 'lastGeneratedDate' | 'isActive'> | RecurringTransaction) => {
    if ('id' in data && data.id) { // existing editing transaction
      updateRecurringTransaction(data as RecurringTransaction);
    } else { // new transaction
      addRecurringTransaction(data as Omit<RecurringTransaction, 'id' | 'userId' | 'nextDueDate' | 'lastGeneratedDate' | 'isActive'>);
    }
    fetchRecurringTransactions();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('recurringTransactionsPage.confirmDelete', {defaultValue: "Are you sure you want to delete this recurring transaction template?"}))) {
      deleteRecurringTransaction(id);
      fetchRecurringTransactions();
    }
  };
  
  const handleToggleActive = (id: string) => {
    const tx = recurringTransactions.find(t => t.id === id);
    if (tx) {
        updateRecurringTransaction({...tx, isActive: !tx.isActive});
        fetchRecurringTransactions();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="fintrack-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="fintrack-section-title !mb-2 sm:!mb-0 flex items-center">
            <SyncAltIcon className="mr-3 text-primary dark:text-primaryLight" />
            {t('recurringTransactionsPage.title', {defaultValue: "Manage Recurring Transactions"})}
          </h2>
          <Button
            onClick={() => handleOpenModal()}
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon />}
          >
            {t('recurringTransactionsPage.addRecurringButton', {defaultValue: "Add Recurring"})}
          </Button>
        </div>
        <RecurringTransactionList
          transactions={recurringTransactions}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction 
          ? t('recurringTransactionsPage.editModalTitle', {defaultValue: "Edit Recurring Transaction"}) 
          : t('recurringTransactionsPage.addModalTitle', {defaultValue: "Add Recurring Transaction"})}
        size="md"
      >
        <RecurringTransactionForm
          onSubmit={handleSubmitForm}
          initialData={editingTransaction || undefined}
        />
      </Modal>
    </div>
  );
};

export default RecurringTransactionsPage;