/**
 * Opens the settings dialog at the specified section.
 * AppLayout listens for this event via a window event listener.
 */
export function openSettingsAt(section: 'subscription') {
  window.dispatchEvent(new CustomEvent('open-settings', { detail: { section } }));
}
