import { useEffect, useState } from "react";
import { FLASH_MESSAGE_EVENT } from "../../flashMessage";
import { Notice } from "./ui";

export default function FlashMessage() {
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const receive = (event) => setFlash(event.detail);
    window.addEventListener(FLASH_MESSAGE_EVENT, receive);
    return () => window.removeEventListener(FLASH_MESSAGE_EVENT, receive);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), flash.duration);
    return () => clearTimeout(timer);
  }, [flash]);

  return flash && <div className="org-flash" dir="rtl">
    <Notice onClose={() => setFlash(null)}>{flash.message}</Notice>
  </div>;
}
