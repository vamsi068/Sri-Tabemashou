/* Loads the POS application modules only after Firebase data has hydrated.
   This prevents page modules from creating empty/default data before Firestore
   has supplied the real restaurant data. */
(function () {
  "use strict";
  const scripts = (document.currentScript?.dataset?.scripts || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = false;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.body.appendChild(tag);
    });
  }

  async function start() {
    try {
      if (window.firebasePOSReadyPromise) await window.firebasePOSReadyPromise;
      for (const src of scripts) await loadScript(src);
      // The application scripts historically initialize from DOMContentLoaded.
      // They are loaded after Firebase hydration, so emit one controlled event.
      document.dispatchEvent(new Event("DOMContentLoaded"));
    } catch (error) {
      console.error("Sri Tabemashou startup failed:", error);
      document.body.insertAdjacentHTML("afterbegin", '<div style="position:fixed;inset:0;background:#fff;z-index:99999;display:grid;place-items:center;font:16px system-ui;padding:30px;text-align:center">Unable to load restaurant data from Firebase. Check Firebase configuration and Firestore rules, then refresh.</div>');
    }
  }

  start();
})();
