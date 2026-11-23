export const FLASH_MESSAGE_EVENT = "hayat:flash-message";

export function showFlashMessage(message, duration = 3000) {
  window.dispatchEvent(new CustomEvent(FLASH_MESSAGE_EVENT, { detail: { message, duration } }));
}
