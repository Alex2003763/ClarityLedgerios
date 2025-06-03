
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

// Icons for section titles
const QuestionCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-question-circle ${className || "w-8 h-8"}`}></i>
);
const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-rocket ${className || "w-6 h-6"}`}></i>
);
const InfoCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-info-circle ${className || "w-6 h-6"}`}></i>
);
const LifeRingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <i className={`fas fa-life-ring ${className || "w-6 h-6"}`}></i>
);


const HelpCenterPage: React.FC = () => {
  const { t } = useAppContext();

  const faqs = [
    {
      qKey: "helpCenterPage.faq.q1",
      qDefault: "How is my data stored?",
      aKey: "helpCenterPage.faq.a1",
      aDefault: "Your financial data is stored locally in your browser's storage (LocalStorage). It is not sent to any external server, ensuring your privacy."
    },
    {
      qKey: "helpCenterPage.faq.q2",
      qDefault: "Can I use ClarityCoin offline?",
      aKey: "helpCenterPage.faq.a2",
      aDefault: "Yes, ClarityCoin is designed as a Progressive Web App (PWA) and can work offline once it has been loaded in your browser."
    },
    {
      qKey: "helpCenterPage.faq.q3",
      qDefault: "How do I backup my data?",
      aKey: "helpCenterPage.faq.a3",
      aDefault: "You can export all your data, including transactions, budgets, and settings, as a JSON file from the 'Data Management' section on the Settings page. You can also import this data back into the app."
    },
    {
      qKey: "helpCenterPage.faq.q4",
      qDefault: "Are the AI Financial Tips free?",
      aKey: "helpCenterPage.faq.a4",
      aDefault: "ClarityCoin uses the OpenRouter API to provide AI tips. OpenRouter offers access to various AI models, some ofwhich may have free tiers or require credits. You need to provide your own OpenRouter API key in the Settings. Please check OpenRouter's pricing and terms."
    }
  ];

  const gettingStartedSteps = [
    {
      sKey: "helpCenterPage.gettingStarted.s1",
      sDefault: "Navigate to the Dashboard to view your financial overview, including income, expenses, and balance summaries."
    },
    {
      sKey: "helpCenterPage.gettingStarted.s2",
      sDefault: "Use the 'Add Transaction' button on the Dashboard to record your income and expenses. Be sure to select the correct type and category."
    },
    {
      sKey: "helpCenterPage.gettingStarted.s3",
      sDefault: "Set monthly budgets for different expense categories in the 'Monthly Budgets' section on the Dashboard to track your spending goals."
    },
    {
      sKey: "helpCenterPage.gettingStarted.s4",
      sDefault: "Visit the Settings page to configure your OpenRouter API key for AI financial tips, manage custom transaction categories, choose your preferred language and theme, and manage your application data (export/import)."
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-primary-light flex items-center justify-center">
          <QuestionCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-3 text-primary dark:text-primary-light" />
          {t('helpCenterPage.title')}
        </h1>
      </header>

      {/* FAQ Section */}
      <section className="fintrack-card">
        <h2 className="fintrack-section-title flex items-center">
          <InfoCircleIcon className="w-6 h-6 mr-2.5 text-accent dark:text-sky-400" />
          {t('helpCenterPage.faq.title')}
        </h2>
        <dl className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index}>
              <dt className="text-lg font-semibold text-lighttext dark:text-darktext mb-1">{t(faq.qKey, { defaultValue: faq.qDefault })}</dt>
              <dd className="text-sm text-grayText dark:text-gray-400 leading-relaxed">{t(faq.aKey, { defaultValue: faq.aDefault })}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Getting Started Section */}
      <section className="fintrack-card">
        <h2 className="fintrack-section-title flex items-center">
          <RocketIcon className="w-6 h-6 mr-2.5 text-success dark:text-green-400" />
          {t('helpCenterPage.gettingStarted.title')}
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-sm text-grayText dark:text-gray-400">
          {gettingStartedSteps.map((step, index) => (
            <li key={index} className="leading-relaxed">
              <span className="font-medium text-lighttext dark:text-darktext mr-1">{t('helpCenterPage.gettingStarted.step', { number: index + 1 })}:</span>
              {t(step.sKey, { defaultValue: step.sDefault })}
            </li>
          ))}
        </ol>
      </section>

      {/* Contact & Support Section */}
      <section className="fintrack-card">
        <h2 className="fintrack-section-title flex items-center">
          <LifeRingIcon className="w-6 h-6 mr-2.5 text-warning dark:text-yellow-400" />
          {t('helpCenterPage.contact.title')}
        </h2>
        <p className="text-sm text-grayText dark:text-gray-400 mb-2 leading-relaxed">
          {t('helpCenterPage.contact.p1', { appName: t('appName'), defaultValue: `${t('appName')} is a locally-run application designed for personal use. Your data remains on your device.` })}
        </p>
        <p className="text-sm text-grayText dark:text-gray-400 leading-relaxed">
          {t('helpCenterPage.contact.p2', { defaultValue: "For general questions, please consult the FAQs above. If you encounter technical issues or have suggestions, you can (hypothetically) visit the project's GitHub page or community forum if one exists." })}
        </p>
        {/* Example GitHub link placeholder */}
        {/* <p className="mt-3 text-sm">
          <a href="#" className="text-primary dark:text-primaryLight hover:underline">
            {t('helpCenterPage.contact.githubLink', {defaultValue: "Visit Project on GitHub (Example)"})}
          </a>
        </p> */}
      </section>
    </div>
  );
};

export default HelpCenterPage;
