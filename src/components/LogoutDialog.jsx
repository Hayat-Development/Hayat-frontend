export default function LogoutDialog({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return <div className="modal-backdrop-custom" role="presentation" onMouseDown={onCancel}>
    <div className="sprint-modal logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="logout-dialog-body"><span><i className="ti ti-logout" /></span><h2 id="logout-title">تسجيل الخروج</h2><p>هل تريد تسجيل الخروج من منصة حياة؟</p></div>
      <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={onCancel}>إلغاء</button><button type="button" className="btn btn-primary" onClick={onConfirm}>تأكيد تسجيل الخروج</button></div>
    </div>
  </div>;
}
