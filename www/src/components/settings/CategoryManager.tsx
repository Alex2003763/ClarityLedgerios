
import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-3.5 h-3.5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface CategoryManagerProps {
  title: string;
  categories: string[]; // Default categories
  customCategories: string[];
  newCategory: string;
  setNewCategory: (val: string) => void;
  onAdd: () => void;
  onDelete: (name: string) => void;
  categoryTypeForTranslation: 'income' | 'expense'; // Used for unique IDs/keys
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
    title, 
    categories, 
    customCategories, 
    newCategory, 
    setNewCategory, 
    onAdd, 
    onDelete,
    categoryTypeForTranslation
}) => {
  const { t } = useAppContext();

  return (
    <div className="p-4 border border-gray-200 dark:border-darkBorder rounded-lg shadow-sm bg-white dark:bg-darkSurface">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{title}</h3>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settingsPage.customCategories.defaultCategories')}</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
            const translated = t(key) === key ? cat : t(key);
            return (
              <span 
                key={`${categoryTypeForTranslation}-default-${cat}`} 
                className="px-3 py-1 text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-full shadow-xs"
              >
                {translated}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settingsPage.customCategories.yourCustomCategories')}</h4>
        {customCategories.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">{t('settingsPage.customCategories.noCustomYet')}</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar"> {/* Removed p-1 */}
            {customCategories.map(cat => (
              <div 
                key={`${categoryTypeForTranslation}-custom-${cat}`} 
                className="flex items-center px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-700/[0.3] dark:text-primary-200 rounded-full shadow-xs group"
              >
                <span>{cat}</span>
                <button 
                  onClick={() => onDelete(cat)} 
                  className="ml-2 p-0.5 rounded-full text-primary-500 hover:bg-primary-200 dark:text-primary-300 dark:hover:bg-primary-600/[0.5] transition-colors"
                  aria-label={`${t('settingsPage.customCategories.deleteSuccess', { categoryName: cat})}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`new-category-${categoryTypeForTranslation}`} className="sr-only">
          {t('settingsPage.customCategories.addPlaceholder')}
        </label>
        <div className="flex space-x-2 items-center">
          <Input
            id={`new-category-${categoryTypeForTranslation}`}
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder={t('settingsPage.customCategories.addPlaceholder')}
            containerClassName="flex-grow !mb-0" // Remove bottom margin from Input's container
            className="text-sm h-10" // Match button height
            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd();}}}
          />
          <Button 
            onClick={onAdd} 
            variant="secondary" 
            size="sm" // Use sm for a denser look if preferred
            className="h-10 px-3 shrink-0" // Ensure button height matches input
            leftIcon={<PlusCircleIcon className="w-4 h-4" />}
            aria-label={`${t('settingsPage.customCategories.addButton')} ${categoryTypeForTranslation}`}
          >
            {t('settingsPage.customCategories.addButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;