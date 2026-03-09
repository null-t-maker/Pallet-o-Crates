import { LanguagePanelContent } from "./TopbarPanelContent";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";

type TopbarLanguagePanelActionProps = Pick<
  TopbarCorePanelsProps,
  | "t"
  | "language"
  | "setLanguage"
  | "topbarPanels"
  | "languageLabel"
>;

export function TopbarLanguagePanelAction({
  t,
  language,
  setLanguage,
  topbarPanels,
  languageLabel,
}: TopbarLanguagePanelActionProps) {
  return (
    <TopbarActionWithPanel
      wrapperClassName="topbar-language-wrap"
      navRef={topbarPanels.languageNavRef}
      isOpen={topbarPanels.languagePanelOpen}
      title={languageLabel}
      onToggle={topbarPanels.toggleLanguagePanel}
      dropdownClassName="language-dropdown"
      dropdownStyle={topbarPanels.languageDropdownStyle}
    >
      <LanguagePanelContent language={language} setLanguage={setLanguage} t={t} />
    </TopbarActionWithPanel>
  );
}
