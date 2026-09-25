import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';

// Retired walkthrough links reopen the ordinary world and retain its native shared view.
const legacyUrl = new URL(location.href);
if (
  legacyUrl.searchParams.has('situation') ||
  legacyUrl.searchParams.has('story')
) {
  legacyUrl.searchParams.delete('situation');
  legacyUrl.searchParams.delete('story');
  history.replaceState(history.state, '', legacyUrl);
}

const application = createStandaloneApplication({
  googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
  cesiumToken: import.meta.env.CESIUM_ION_TOKEN,
  allowQaRegistration: import.meta.env.DEV,
});

application.start().catch((error) => {
  console.error("God's Eye View initialization failed:", error);
  const loaderStatus = document.querySelector('#loading-screen .loader-status');
  loaderStatus.textContent = `Error: ${describeError(error)}`;
  loaderStatus.style.color = '#ff4444';
});

export { application };
