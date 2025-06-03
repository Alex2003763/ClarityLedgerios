
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  Language,
  DEFAULT_LANGUAGE,
  LOCAL_STORAGE_LANGUAGE_KEY,
  LOCAL_STORAGE_DARK_MODE_KEY,
  AVAILABLE_CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  LOCAL_STORAGE_SELECTED_CURRENCY_KEY
} from '../constants';
import { CurrencyDefinition } from '../types';

// Define the shape of the context data
interface AppContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  selectedCurrencyCode: string;
  setSelectedCurrencyCode: (code: string) => void;
  selectedCurrencySymbol: string;
  formatCurrency: (amount: number) => string;
}

// Create the context with a default undefined value
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Define translations type
type Translations = Record<string, string | Record<string, string>>;

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
    return (storedLang ? storedLang : DEFAULT_LANGUAGE) as Language;
  });

  const [isDarkMode, setCurrentDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem(LOCAL_STORAGE_DARK_MODE_KEY);
    if (storedDarkMode !== null) {
      return storedDarkMode === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [translations, setTranslations] = useState<Translations>({});

  const [selectedCurrencyCode, setSelectedCurrencyState] = useState<string>(() => {
    const storedCurrency = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY);
    return storedCurrency || DEFAULT_CURRENCY_CODE;
  });

  const [selectedCurrencySymbol, setSelectedCurrencySymbolState] = useState<string>(() => {
    // Initialize based on selectedCurrencyCode's initial value
    const initialCode = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY) || DEFAULT_CURRENCY_CODE;
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === initialCode);
    return currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$');
  });

  useEffect(() => {
    const loadTranslations = async () => {
      let effectiveLanguage = language;
      let translationsData: Translations | null = null;

      const fetchTranslationsForLang = async (langToFetch: Language): Promise<Translations | null> => {
        // Locale files are now served from the root, typically from a 'public' or 'static' folder.
        const path = `/locales/${langToFetch}.json`; // Changed to root-relative path
        try {
          const response = await fetch(path);
          if (!response.ok) {
            console.error(`Failed to fetch translations for ${langToFetch} from ${path}. Status: ${response.status} ${response.statusText}`);
            const responseText = await response.text().catch(() => "Could not read response text.");
            console.error(`Response text for ${path}: ${responseText}`);
            return null;
          }
          return await response.json();
        } catch (error) {
          console.error(`Network or other error fetching translations for ${langToFetch} from ${path}:`, error);
          return null;
        }
      };

      translationsData = await fetchTranslationsForLang(effectiveLanguage);

      if (!translationsData) {
        console.warn(`Could not load translations for ${effectiveLanguage}. Attempting fallback to ${DEFAULT_LANGUAGE}.`);
        const previousEffectiveLanguage = effectiveLanguage;
        effectiveLanguage = DEFAULT_LANGUAGE;
        translationsData = await fetchTranslationsForLang(DEFAULT_LANGUAGE);
        if (!translationsData) {
            console.error(`CRITICAL: Failed to load even default (${DEFAULT_LANGUAGE}) translations after failing for ${previousEffectiveLanguage}. Setting empty translations.`);
            setTranslations({});
        } else {
            setTranslations(translationsData);
        }
      } else {
        setTranslations(translationsData);
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
  }, []);

  const setIsDarkMode = useCallback((isDark: boolean) => {
    setCurrentDarkMode(isDark);
    localStorage.setItem(LOCAL_STORAGE_DARK_MODE_KEY, String(isDark));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: string | Translations | undefined = translations;
    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = (current as Record<string, string | Translations>)[k];
      } else {
        return key;
      }
    }

    let parsedString = typeof current === 'string' ? current : key;

    if (replacements && typeof parsedString === 'string') {
      let resultString = parsedString;
      Object.keys(replacements).forEach(placeholderKey => {
        const valueToInsert = String(replacements[placeholderKey]);
        const patternToReplace = `{${placeholderKey}}`;
        // Loop to replace all occurrences, similar to 'g' flag in regex
        // String.prototype.replaceAll could be used if ES2021 is target,
        // but a loop is more compatible.
        while (resultString.includes(patternToReplace)) {
            resultString = resultString.replace(patternToReplace, valueToInsert);
        }
      });
      parsedString = resultString; // Update parsedString with the result of all replacements
    }
    return parsedString;
  }, [translations]);

  const setSelectedCurrencyCode = useCallback((code: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === code);
    if (currency) {
      setSelectedCurrencyState(code);
      setSelectedCurrencySymbolState(currency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, code);
    } else {
      // Fallback to default if invalid code is provided
      const defaultCurrency = AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE) || AVAILABLE_CURRENCIES[0];
      setSelectedCurrencyState(defaultCurrency.code);
      setSelectedCurrencySymbolState(defaultCurrency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, defaultCurrency.code);
    }
  }, []);

  // Effect to update symbol if code changes externally (e.g. initial load with different stored value)
  useEffect(() => {
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrencyCode);
    setSelectedCurrencySymbolState(currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$'));
  }, [selectedCurrencyCode]);


  const formatCurrency = useCallback((amount: number): string => {
    const isJPY = selectedCurrencyCode === 'JPY';
    // For JPY, no decimals is standard.
    if (isJPY) {
        return `${selectedCurrencySymbol}${amount.toFixed(0)}`;
    }
    return `${selectedCurrencySymbol}${amount.toFixed(2)}`;
  }, [selectedCurrencySymbol, selectedCurrencyCode]);

  const contextValue: AppContextType = {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    t,
    selectedCurrencyCode,
    setSelectedCurrencyCode,
    selectedCurrencySymbol,
    formatCurrency
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
