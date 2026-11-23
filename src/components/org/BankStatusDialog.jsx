import { SUCCESS } from "../../constants/org";
import { setBankStatus } from "../../services/orgApi";
import StatusDialog from "./StatusDialog";

export default function BankStatusDialog({ bank, onDone, onCancel }) {
  const suspending = bank.status === "active";
  return <StatusDialog
    status={suspending ? "suspended" : "active"}
    title={suspending ? `إيقاف ${bank.name}؟` : `تفعيل ${bank.name}؟`}
    text={suspending ? "لن يستطيع ممثل المؤسسة وموظفوها استخدام لوحة المؤسسة حتى إعادة تفعيلها."
      : "يعود أصحاب الحسابات النشطة إلى استخدام لوحة المؤسسة."}
    save={(status, reason) => setBankStatus(bank.id, status, reason)}
    success={suspending ? SUCCESS.bankSuspended : SUCCESS.bankActivated}
    onDone={onDone} onCancel={onCancel} />;
}
