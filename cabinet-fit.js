"use strict";

function releaseInnerArcadeFit() {
  document.body.classList.remove("fit-arcade");

  const shell = document.querySelector(".cabinet-monitor .arcade-shell");
  if (!shell) return;

  shell.style.position = "static";
  shell.style.left = "auto";
  shell.style.top = "auto";
  shell.style.transform = "none";
  shell.style.transformOrigin = "center center";
  shell.style.margin = "0";
}

function fitCabinetShell() {
  const cabinet = document.querySelector(".arcade-cabinet");
  if (!cabinet) return;

  releaseInnerArcadeFit();
  document.body.classList.add("fit-cabinet");
  cabinet.style.transform = "none";

  const margin = 10;
  const naturalWidth = cabinet.offsetWidth;
  const naturalHeight = cabinet.offsetHeight;
  const widthScale = (window.innerWidth - margin * 2) / naturalWidth;
  const heightScale = (window.innerHeight - margin * 2) / naturalHeight;
  const scale = Math.max(0.1, Math.min(1, widthScale, heightScale));
  const fittedWidth = naturalWidth * scale;
  const fittedHeight = naturalHeight * scale;

  cabinet.style.left = `${Math.max(margin, (window.innerWidth - fittedWidth) / 2)}px`;
  cabinet.style.top = `${Math.max(margin, (window.innerHeight - fittedHeight) / 2)}px`;
  cabinet.style.transform = `scale(${scale})`;

  document.body.style.minWidth = `${Math.ceil(fittedWidth + margin * 2)}px`;
  document.body.style.minHeight = `${Math.ceil(fittedHeight + margin * 2)}px`;
}

function scheduleCabinetFit() {
  fitCabinetShell();
  requestAnimationFrame(fitCabinetShell);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleCabinetFit);
} else {
  scheduleCabinetFit();
}

window.addEventListener("resize", scheduleCabinetFit);
