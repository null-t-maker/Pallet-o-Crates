import { SettingsPanelContent } from "./TopbarPanelContent";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";

type TopbarSettingsPanelActionProps = Pick<
  TopbarCorePanelsProps,
  | "t"
  | "settings"
  | "topbarPanels"
  | "settingsLabel"
  | "settingsSaveLabel"
  | "settingsRestoreDefaultsLabel"
  | "uiZoomAndScaleLabel"
  | "shortcutActivationLabel"
  | "shortcutPressLabel"
  | "uiAccessOpenLabel"
  | "uiAccessCloseLabel"
>;

export function TopbarSettingsPanelAction({
  t,
  settings,
  topbarPanels,
  settingsLabel,
  settingsSaveLabel,
  settingsRestoreDefaultsLabel,
  uiZoomAndScaleLabel,
  shortcutActivationLabel,
  shortcutPressLabel,
  uiAccessOpenLabel,
  uiAccessCloseLabel,
}: TopbarSettingsPanelActionProps) {
  return (
    <TopbarActionWithPanel
      wrapperClassName="topbar-settings-wrap"
      navRef={topbarPanels.settingsNavRef}
      isOpen={topbarPanels.settingsOpen}
      title={settingsLabel}
      onToggle={topbarPanels.toggleSettingsOpen}
      dropdownClassName="settings-dropdown"
      dropdownStyle={topbarPanels.settingsDropdownStyle}
    >
      <SettingsPanelContent
        t={t}
        settings={settings}
        settingsSaveLabel={settingsSaveLabel}
        settingsRestoreDefaultsLabel={settingsRestoreDefaultsLabel}
        uiZoomAndScaleLabel={uiZoomAndScaleLabel}
        shortcutActivationLabel={shortcutActivationLabel}
        shortcutPressLabel={shortcutPressLabel}
        uiAccessOpenLabel={uiAccessOpenLabel}
        uiAccessCloseLabel={uiAccessCloseLabel}
      />
    </TopbarActionWithPanel>
  );
}
