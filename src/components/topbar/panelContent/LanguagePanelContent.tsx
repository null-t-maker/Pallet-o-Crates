import type { Dispatch, SetStateAction } from "react";
import type { Language, Translations } from "../../../i18n";
import { LanguagePickerPanel } from "../../Sidebar";

interface LanguagePanelContentProps {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  t: Translations;
}

export function LanguagePanelContent({
  language,
  setLanguage,
  t,
}: LanguagePanelContentProps) {
  return (
    <div className="section-body topbar-dropdown-body">
      <LanguagePickerPanel
        language={language}
        setLanguage={setLanguage}
        t={t}
        includeDevtool
      />
    </div>
  );
}
