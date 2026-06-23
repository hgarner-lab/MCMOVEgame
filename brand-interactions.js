"use strict";

const BRAND_TAGLINE = "Modernise global money movement.";

function getVisibilityValue() {
  const visibilityText = document.getElementById("visibilityText");
  if (!visibilityText) return 0;
  const value = Number.parseInt(visibilityText.textContent.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function updateMoveSignal() {
  const bars = document.querySelectorAll(".signal-bars span");
  if (!bars.length) return;

  const visibility = getVisibilityValue();
  const activeBars = visibility <= 0 ? 0 : Math.min(4, Math.ceil(visibility / 25));

  bars.forEach((bar, index) => {
    bar.classList.toggle("active", index < activeBars);
  });

  const signalWrap = document.querySelector(".signal-bars");
  if (signalWrap) {
    signalWrap.dataset.visibilityTier = String(activeBars);
  }
}

function patchBrandCopy() {
  if (typeof setRecentEvent === "function") {
    const originalSetRecentEvent = setRecentEvent;
    setRecentEvent = function patchedSetRecentEvent(eventText, effectText) {
      const nextEffect = effectText === "Move payments. Power business." ? BRAND_TAGLINE : effectText;
      return originalSetRecentEvent(eventText, nextEffect);
    };
  }

  if (typeof drawStartScreen === "function") {
    drawStartScreen = function patchedDrawStartScreen(time) {
      drawOverlayPanel();
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#f7fbff";
      ctx.font = "900 30px Courier New";
      ctx.fillText("CROSS-BORDER", CANVAS_WIDTH / 2, 238);
      ctx.fillStyle = "#ff8a00";
      ctx.shadowColor = "#ff8a00";
      ctx.shadowBlur = 14;
      ctx.font = "900 54px Courier New";
      ctx.fillText("CROSSING", CANVAS_WIDTH / 2, 294);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f79e1b";
      ctx.font = "700 20px Courier New";
      ctx.fillText(BRAND_TAGLINE, CANVAS_WIDTH / 2, 338);
      ctx.fillStyle = Math.sin(time * 5) > 0 ? "#ffc400" : "#ffffff";
      ctx.font = "900 24px Courier New";
      ctx.fillText("PRESS ENTER TO START", CANVAS_WIDTH / 2, 405);
      ctx.fillStyle = "#aeb9c6";
      ctx.font = "16px Courier New";
      ctx.fillText("Arrows / WASD move one tile. SPACE uses a power-up.", CANVAS_WIDTH / 2, 448);
      ctx.restore();
    };
  }
}

function loopMoveSignal() {
  updateMoveSignal();
  requestAnimationFrame(loopMoveSignal);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    patchBrandCopy();
    loopMoveSignal();
  });
} else {
  patchBrandCopy();
  loopMoveSignal();
}
