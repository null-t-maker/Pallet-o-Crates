import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Translations } from "../../../i18n";
import { shortcutToLabel } from "../../../hooks/useUiOverlays";
import type { SettingsControls } from "../topbarPanelTypes";

interface SettingsPanelContentProps {
  t: Translations;
  settings: SettingsControls;
  settingsSaveLabel: string;
  settingsRestoreDefaultsLabel: string;
  uiZoomAndScaleLabel: string;
  shortcutActivationLabel: string;
  shortcutPressLabel: string;
  uiAccessOpenLabel: string;
  uiAccessCloseLabel: string;
}

export function SettingsPanelContent({
  t,
  settings,
  settingsSaveLabel,
  settingsRestoreDefaultsLabel,
  uiZoomAndScaleLabel,
  shortcutActivationLabel,
  shortcutPressLabel,
  uiAccessOpenLabel,
  uiAccessCloseLabel,
}: SettingsPanelContentProps) {
  const [uiSectionCollapsed, setUiSectionCollapsed] = useState(false);
  const [diagnosticsSectionCollapsed, setDiagnosticsSectionCollapsed] = useState(false);
  const [sampleDatabaseSectionCollapsed, setSampleDatabaseSectionCollapsed] = useState(false);

  return (
    <div className="section-body settings-panel-body">
      <button
        type="button"
        className="settings-save-btn"
        onClick={settings.saveSettings}
        disabled={!settings.settingsDirty}
      >
        {settingsSaveLabel}
      </button>

      <div className="settings-sections">
        <section className="section-card settings-section-card">
          <button
            type="button"
            className="section-titlebar settings-section-toggle"
            onClick={() => setUiSectionCollapsed((prev) => !prev)}
            aria-expanded={!uiSectionCollapsed}
          >
            <span className="section-title" title={uiZoomAndScaleLabel}>{uiZoomAndScaleLabel}</span>
            <span className="section-arrow">
              {uiSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {!uiSectionCollapsed && (
            <div className="section-body settings-section-body">
              <div className="settings-field">
                <label>{shortcutActivationLabel}</label>
                <button
                  type="button"
                  className={`settings-shortcut-btn ${settings.capturingShortcutTarget === "uiAccess" ? "is-capturing" : ""}`}
                  onClick={() => settings.setCapturingShortcutTarget("uiAccess")}
                >
                  {settings.capturingShortcutTarget === "uiAccess"
                    ? shortcutPressLabel
                    : shortcutToLabel(settings.uiAccessShortcutDraft)}
                </button>
              </div>

              <button
                type="button"
                className="settings-open-btn"
                onClick={settings.toggleUiAccess}
              >
                {settings.uiAccessOpen ? uiAccessCloseLabel : uiAccessOpenLabel}
              </button>
            </div>
          )}
        </section>

        <section className="section-card settings-section-card">
          <button
            type="button"
            className="section-titlebar settings-section-toggle"
            onClick={() => setDiagnosticsSectionCollapsed((prev) => !prev)}
            aria-expanded={!diagnosticsSectionCollapsed}
          >
            <span className="section-title" title={t.diagnostics}>{t.diagnostics}</span>
            <span className="section-arrow">
              {diagnosticsSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {!diagnosticsSectionCollapsed && (
            <div className="section-body settings-section-body">
              <div className="settings-field">
                <label>{shortcutActivationLabel}</label>
                <button
                  type="button"
                  className={`settings-shortcut-btn ${settings.capturingShortcutTarget === "diagnostics" ? "is-capturing" : ""}`}
                  onClick={() => settings.setCapturingShortcutTarget("diagnostics")}
                >
                  {settings.capturingShortcutTarget === "diagnostics"
                    ? shortcutPressLabel
                    : shortcutToLabel(settings.diagnosticsShortcutDraft)}
                </button>
              </div>

              <button
                type="button"
                className="settings-open-btn"
                onClick={settings.toggleDiagnostics}
              >
                {settings.diagnosticsOpen ? uiAccessCloseLabel : uiAccessOpenLabel}
              </button>
            </div>
          )}
        </section>

        <section className="section-card settings-section-card">
          <button
            type="button"
            className="section-titlebar settings-section-toggle"
            onClick={() => setSampleDatabaseSectionCollapsed((prev) => !prev)}
            aria-expanded={!sampleDatabaseSectionCollapsed}
          >
            <span className="section-title" title={t.sampleDatabaseLabel ?? "Sample database"}>
              {t.sampleDatabaseLabel ?? "Sample database"}
            </span>
            <span className="section-arrow">
              {sampleDatabaseSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {!sampleDatabaseSectionCollapsed && (
            <div className="section-body settings-section-body">
              <div className="settings-field">
                <label>{t.sampleDatabaseSectionVisibilityLabel ?? "Section visibility"}</label>
                <div className="settings-switch-row" role="group" aria-label={t.sampleDatabaseSectionVisibilityLabel ?? "Section visibility"}>
                  <button
                    type="button"
                    className={`settings-switch-btn${settings.sampleDatabasePanelVisible ? " is-active" : ""}`}
                    aria-pressed={settings.sampleDatabasePanelVisible}
                    onClick={() => {
                      if (!settings.sampleDatabasePanelVisible) {
                        settings.toggleSampleDatabasePanelVisible();
                      }
                    }}
                  >
                    {t.sampleDatabaseShowSectionLabel ?? "Show"}
                  </button>
                  <button
                    type="button"
                    className={`settings-switch-btn${!settings.sampleDatabasePanelVisible ? " is-active" : ""}`}
                    aria-pressed={!settings.sampleDatabasePanelVisible}
                    onClick={() => {
                      if (settings.sampleDatabasePanelVisible) {
                        settings.toggleSampleDatabasePanelVisible();
                      }
                    }}
                  >
                    {t.sampleDatabaseHideSectionLabel ?? "Hide"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        className="settings-restore-btn"
        onClick={settings.restoreUiAccessDefaults}
      >
        {settingsRestoreDefaultsLabel}
      </button>
    </div>
  );
}
