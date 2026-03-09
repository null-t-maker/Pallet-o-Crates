import type { FC } from "react";
import { SectionPanel } from "./SectionPanel";
import { LanguagePickerPanel } from "./LanguagePickerPanel";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

type SidebarLanguageSectionProps = Pick<
  SidebarSectionsProps,
  | "showLanguageSection"
  | "collapsedSections"
  | "toggleSection"
  | "language"
  | "setLanguage"
  | "t"
>;

export const SidebarLanguageSection: FC<SidebarLanguageSectionProps> = ({
  showLanguageSection,
  collapsedSections,
  toggleSection,
  language,
  setLanguage,
  t,
}) => {
  if (!showLanguageSection) return null;

  return (
    <SectionPanel
      title={t.languageLabel}
      collapsed={collapsedSections.language}
      onToggle={() => toggleSection("language")}
      className="language-section"
    >
      <LanguagePickerPanel
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
    </SectionPanel>
  );
};
