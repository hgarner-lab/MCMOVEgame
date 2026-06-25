(function () {
  "use strict";

  const STAGE_WIDTH = 1536;
  const STAGE_HEIGHT = 1024;
  const VIEWPORT_MARGIN = 20;

  function fitCabinetStage() {
    const widthScale = (window.innerWidth - VIEWPORT_MARGIN) / STAGE_WIDTH;
    const heightScale = (window.innerHeight - VIEWPORT_MARGIN) / STAGE_HEIGHT;
    const scale = Math.max(0.1, Math.min(1, widthScale, heightScale));

    document.documentElement.style.setProperty("--cabinet-scale", String(scale));
    document.body.classList.add("cabinet-ready");
    document.body.style.minHeight = "100vh";
    document.body.style.overflow = "hidden";
  }

  window.addEventListener("resize", fitCabinetStage);
  window.addEventListener("orientationchange", fitCabinetStage);
  fitCabinetStage();
})();
