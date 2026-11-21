const STORAGE_KEY = "hayat_flash_message";
export const FLASH_MESSAGE_EVENT = "hayat:flash-message";

export function showFlashMessage(message, type = "success", duration = 3000) {
  const detail = { message, type, duration, id: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent(FLASH_MESSAGE_EVENT, { detail }));
}

export function consumeStoredFlashMessage() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
