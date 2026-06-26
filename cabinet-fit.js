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

  function applyGameVisualTweaks() {
    if (typeof ctx === "undefined" || typeof TILE_H === "undefined" || typeof CANVAS_WIDTH === "undefined") {
      return;
    }

    drawZoneBand = function drawZoneBandWithoutFlags(rowStart, rowSpan, color, title, subtitle) {
      const y = rowStart * TILE_H;
      const height = rowSpan * TILE_H;
      ctx.save();
      ctx.fillStyle = hexToRgba(color, 0.08);
      ctx.fillRect(0, y, CANVAS_WIDTH, height);
      ctx.strokeStyle = hexToRgba(color, 0.78);
      ctx.setLineDash([9, 5]);
      ctx.strokeRect(8.5, y + 8.5, CANVAS_WIDTH - 17, height - 17);
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.font = "700 24px Courier New";
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(title, CANVAS_WIDTH / 2, y + height * 0.45);
      ctx.font = "700 17px Courier New";
      ctx.fillText(subtitle, CANVAS_WIDTH / 2, y + height * 0.72);
      ctx.restore();
    };

    drawShieldIcon = function drawCenteredShieldIcon(width, height, color) {
      const centerX = width / 2;
      const centerY = height / 2;
      const iconWidth = Math.min(width * 0.64, 34);
      const iconHeight = Math.min(height * 0.92, 27);
      const left = centerX - iconWidth / 2;
      const top = centerY - iconHeight / 2;

      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(centerX, top + 1);
      ctx.lineTo(left + iconWidth - 4, top + 6);
      ctx.lineTo(left + iconWidth - 8, top + iconHeight * 0.66);
      ctx.quadraticCurveTo(centerX + iconWidth * 0.18, top + iconHeight - 2, centerX, top + iconHeight);
      ctx.quadraticCurveTo(centerX - iconWidth * 0.18, top + iconHeight - 2, left + 8, top + iconHeight * 0.66);
      ctx.lineTo(left + 4, top + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - iconWidth * 0.2, centerY + iconHeight * 0.02);
      ctx.lineTo(centerX - iconWidth * 0.05, centerY + iconHeight * 0.17);
      ctx.lineTo(centerX + iconWidth * 0.24, centerY - iconHeight * 0.2);
      ctx.stroke();
      ctx.restore();
    };
  }

  window.addEventListener("resize", fitCabinetStage);
  window.addEventListener("orientationchange", fitCabinetStage);
  fitCabinetStage();
  applyGameVisualTweaks();
})();
