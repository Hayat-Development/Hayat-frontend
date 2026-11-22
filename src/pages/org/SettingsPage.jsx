import OrgShell from "../../components/org/OrgShell";

// صفحة فاضية مؤقتة — الإعدادات خارج نطاق السبرنت 2.
export default function SettingsPage() {
  return (
    <OrgShell title="الإعدادات">
      <section className="org-card">
        <div className="org-state">
          <i className="ti ti-settings org-state-icon" aria-hidden="true" />
          <h3>الإعدادات قادمة قريبًا</h3>
          <p>لا توجد إعدادات متاحة في هذه المرحلة.</p>
        </div>
      </section>
    </OrgShell>
  );
}
