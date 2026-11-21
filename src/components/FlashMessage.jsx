import { useEffect, useState } from "react";
import { consumeStoredFlashMessage, FLASH_MESSAGE_EVENT } from "../flashMessage";

export default function FlashMessage() {
  const [flash, setFlash] = useState(consumeStoredFlashMessage);

  useEffect(() => {
    const receive = (event) => {
      sessionStorage.removeItem("hayat_flash_message");
      setFlash(event.detail);
    };
    window.addEventListener(FLASH_MESSAGE_EVENT, receive);
    return () => window.removeEventListener(FLASH_MESSAGE_EVENT, receive);
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = window.setTimeout(() => setFlash(null), flash.duration || 3000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  if (!flash) return null;

  return <div className={`global-flash global-flash-${flash.type}`} role="status" aria-live="polite">
    <i className={flash.type === "success" ? "ti ti-circle-check" : "ti ti-info-circle"} aria-hidden="true" />
    <span>{flash.message}</span>
    <button type="button" aria-label="إغلاق الرسالة" onClick={() => setFlash(null)}><i className="ti ti-x" /></button>
  </div>;
}
