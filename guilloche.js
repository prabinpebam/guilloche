// Get canvas and context.
const canvas = document.getElementById("guillocheCanvas");
const ctx = canvas.getContext("2d");

// Resize the canvas to use the full available viewport (minus controls).
function resizeCanvas() {
  const controlsWidth = document.getElementById("controls").offsetWidth;
  canvas.width = window.innerWidth - controlsWidth;
  canvas.height = window.innerHeight;
  update();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ----- Helper Functions -----
function updateDisplay(id, value) {
  document.getElementById(id).textContent = value;
}

function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    let hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function interpolateColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, b);
}

function getGradientColor(t, colors) {
  const n = colors.length;
  if (t >= 1) t = 1;
  const segment = 1 / (n - 1);
  let index = Math.floor(t / segment);
  if (index >= n - 1) index = n - 2;
  const t_local = (t - index * segment) / segment;
  return interpolateColor(colors[index], colors[index + 1], t_local);
}

function computePoint(R, r, d, t_eff) {
  const epsilon = 0.0001;
  let x, y;
  if (Math.abs(d - r) < epsilon) {
    // Epicycloid.
    x = (R + r) * Math.cos(t_eff) - r * Math.cos(((R + r) / r) * t_eff);
    y = (R + r) * Math.sin(t_eff) - r * Math.sin(((R + r) / r) * t_eff);
  } else if (d < r) {
    // Hypotrochoid.
    x = (R - r) * Math.cos(t_eff) + d * Math.cos(((R - r) / r) * t_eff);
    y = (R - r) * Math.sin(t_eff) - d * Math.sin(((R - r) / r) * t_eff);
  } else {
    // Epitrochoid.
    x = (R + r) * Math.cos(t_eff) - d * Math.cos(((R + r) / r) * t_eff);
    y = (R + r) * Math.sin(t_eff) - d * Math.sin(((R + r) / r) * t_eff);
  }
  return { x, y };
}

// ----- Canvas Background Update -----
// Updates the canvas background color based on the canvasBg color picker.
function updateCanvasBackground() {
  const bgColor = document.getElementById("canvasBg").value;
  canvas.style.backgroundColor = bgColor;
  updateDisplay("canvasBg_val", bgColor);
}

// ----- Drawing Function -----
// Draws the Guilloché pattern, applies polar displacement, and colors segments with a looping gradient.
function drawGuilloche(R, r, d, num_curves, offset_deg, t_range_rotations, t_step, global_rotation_deg, thickness, gradientLoopCount, colors, dispAmp, dispFreq, dispPhase, dispExp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = thickness;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const total_t = t_range_rotations * 2 * Math.PI;
  const offset_rad = offset_deg * Math.PI / 180;
  const globalRot = global_rotation_deg * Math.PI / 180;
  const dispPhaseRad = dispPhase * Math.PI / 180;
  
  for (let curveIndex = 0; curveIndex < num_curves; curveIndex++) {
    const curve_offset = offset_rad * curveIndex;
    let points = [];
    for (let t = 0; t <= total_t; t += t_step) {
      const t_eff = t + curve_offset;
      let pt = computePoint(R, r, d, t_eff);
      pt.x += centerX;
      pt.y += centerY;
      const dx = pt.x - centerX;
      const dy = pt.y - centerY;
      const rotatedX = centerX + dx * Math.cos(globalRot) - dy * Math.sin(globalRot);
      const rotatedY = centerY + dx * Math.sin(globalRot) + dy * Math.cos(globalRot);
      let angle = Math.atan2(rotatedY - centerY, rotatedX - centerX);
      let r_orig = Math.sqrt((rotatedX - centerX) ** 2 + (rotatedY - centerY) ** 2);
      let s = Math.sin(dispFreq * angle + dispPhaseRad);
      let mod = Math.sign(s) * Math.pow(Math.abs(s), dispExp) * dispAmp;
      let new_r = r_orig + mod;
      let finalX = centerX + new_r * Math.cos(angle);
      let finalY = centerY + new_r * Math.sin(angle);
      points.push({ x: finalX, y: finalY });
    }
    
    let totalLength = 0;
    let segLengths = [];
    for (let i = 0; i < points.length - 1; i++) {
      const segLen = distance(points[i], points[i + 1]);
      segLengths.push(segLen);
      totalLength += segLen;
    }
    
    let cumulativeLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const segLen = segLengths[i];
      const pos = (cumulativeLength + segLen / 2) / totalLength;
      const colorPos = (pos * gradientLoopCount) % 1;
      const color = getGradientColor(colorPos, colors);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      cumulativeLength += segLen;
    }
  }
}

// ----- Update & Animation -----
function update() {
  updateCanvasBackground(); // Update the canvas background color in real time.
  
  // Core parameters.
  const R = parseFloat(document.getElementById("R").value);
  const r = parseFloat(document.getElementById("r").value);
  const d = parseFloat(document.getElementById("d").value);
  const num_curves = parseInt(document.getElementById("num_curves").value);
  const offset_deg = parseFloat(document.getElementById("offset").value);
  const t_range_rotations = parseFloat(document.getElementById("t_range").value);
  const t_step = parseFloat(document.getElementById("t_step").value);
  const global_rotation_deg = parseFloat(document.getElementById("rotation").value);
  const thickness = parseFloat(document.getElementById("thickness").value);
  const gradientLoopCount = parseFloat(document.getElementById("gradientLoops").value);
  const colors = [
    document.getElementById("color1").value,
    document.getElementById("color2").value,
    document.getElementById("color3").value,
    document.getElementById("color4").value
  ];
  
  // Secondary (polar displacement) parameters (base values).
  const baseDispAmp = parseFloat(document.getElementById("dispAmp").value);
  const baseDispFreq = parseFloat(document.getElementById("dispFreq").value);
  const baseDispPhase = parseFloat(document.getElementById("dispPhase").value);
  const dispExp = parseFloat(document.getElementById("dispExp").value);
  
  // Update display spans.
  updateDisplay("R_val", R);
  updateDisplay("r_val", r);
  updateDisplay("d_val", d);
  updateDisplay("num_curves_val", num_curves);
  updateDisplay("offset_val", offset_deg);
  updateDisplay("t_range_val", t_range_rotations);
  updateDisplay("t_step_val", t_step);
  updateDisplay("rotation_val", global_rotation_deg);
  updateDisplay("thickness_val", thickness);
  updateDisplay("gradientLoops_val", gradientLoopCount);
  updateDisplay("dispAmp_val", baseDispAmp);
  updateDisplay("dispFreq_val", baseDispFreq);
  updateDisplay("dispPhase_val", baseDispPhase);
  updateDisplay("dispExp_val", dispExp);
  
  // Calculate perfect closure.
  const ratio = (d < r) ? (R - r) / r : (R + r) / r;
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function approximateClosure(x, maxDenom = 1000) {
    let bestNum = 1, bestDenom = 1, bestError = Math.abs(x - bestNum / bestDenom);
    for (let denom = 1; denom <= maxDenom; denom++) {
      let num = Math.round(x * denom);
      let error = Math.abs(x - num / denom);
      if (error < bestError) { bestError = error; bestNum = num; bestDenom = denom; }
      if (error < 1e-6) break;
    }
    const g = gcd(bestNum, bestDenom);
    bestNum /= g;
    bestDenom /= g;
    return bestDenom;
  }
  const perfectClosure = approximateClosure(ratio);
  document.getElementById("t_closure").textContent = perfectClosure;
  
  // If animation is enabled, modify the secondary parameters.
  let dispAmpToUse = baseDispAmp;
  let dispPhaseToUse = baseDispPhase;
  if (document.getElementById("animateToggle").checked) {
    const period = 5000; // 5 seconds per full cycle.
    const now = Date.now();
    const elapsed = now % period;
    const phaseOffset = (elapsed / period) * 360; // in degrees
    const ampOffset = 30 * Math.sin((elapsed / period) * 2 * Math.PI);
    dispPhaseToUse = baseDispPhase + phaseOffset;
    dispAmpToUse = baseDispAmp + ampOffset;
  }
  
  // Draw the pattern.
  drawGuilloche(R, r, d, num_curves, offset_deg, t_range_rotations, t_step, global_rotation_deg, thickness, gradientLoopCount, colors, dispAmpToUse, baseDispFreq, dispPhaseToUse, dispExp);
}

// Animation loop.
function animationLoop() {
  if (document.getElementById("animateToggle").checked) {
    update();
    requestAnimationFrame(animationLoop);
  }
}

// Listen to changes on the animate toggle.
document.getElementById("animateToggle").addEventListener("change", function () {
  if (this.checked) {
    requestAnimationFrame(animationLoop);
  } else {
    update();
  }
});

// Listen to changes on the canvas background color picker.
document.getElementById("canvasBg").addEventListener("input", update);

// Add event listeners for all controls.
const controls = [
  "R", "r", "d", "num_curves", "offset",
  "t_range", "t_step", "rotation", "thickness",
  "color1", "color2", "color3", "color4",
  "gradientLoops", "dispAmp", "dispFreq", "dispPhase", "dispExp"
];
controls.forEach(id => {
  document.getElementById(id).addEventListener("input", update);
});
document.getElementById("exportSVG").addEventListener("click", exportSVG);

// On page load, if animate is checked, start the animation loop.
if (document.getElementById("animateToggle").checked) {
  requestAnimationFrame(animationLoop);
}

// Initial drawing.
update();

// ----- Export SVG Function -----
function exportSVG() {
  const R = parseFloat(document.getElementById("R").value);
  const r = parseFloat(document.getElementById("r").value);
  const d = parseFloat(document.getElementById("d").value);
  const num_curves = parseInt(document.getElementById("num_curves").value);
  const offset_deg = parseFloat(document.getElementById("offset").value);
  const t_range_rotations = parseFloat(document.getElementById("t_range").value);
  const t_step = parseFloat(document.getElementById("t_step").value);
  const global_rotation_deg = parseFloat(document.getElementById("rotation").value);
  const thickness = parseFloat(document.getElementById("thickness").value);
  const gradientLoopCount = parseFloat(document.getElementById("gradientLoops").value);
  const colors = [
    document.getElementById("color1").value,
    document.getElementById("color2").value,
    document.getElementById("color3").value,
    document.getElementById("color4").value
  ];
  const baseDispAmp = parseFloat(document.getElementById("dispAmp").value);
  const baseDispFreq = parseFloat(document.getElementById("dispFreq").value);
  const baseDispPhase = parseFloat(document.getElementById("dispPhase").value);
  const dispExp = parseFloat(document.getElementById("dispExp").value);
  
  let dispAmpToUse = baseDispAmp;
  let dispPhaseToUse = baseDispPhase;
  if (document.getElementById("animateToggle").checked) {
    const period = 5000;
    const now = Date.now();
    const elapsed = now % period;
    const phaseOffset = (elapsed / period) * 360;
    const ampOffset = 30 * Math.sin((elapsed / period) * 2 * Math.PI);
    dispPhaseToUse = baseDispPhase + phaseOffset;
    dispAmpToUse = baseDispAmp + ampOffset;
  }
  
  const centerX = 400, centerY = 400;
  const total_t = t_range_rotations * 2 * Math.PI;
  const offset_rad = offset_deg * Math.PI / 180;
  const globalRot = global_rotation_deg * Math.PI / 180;
  const dispPhaseRad = dispPhaseToUse * Math.PI / 180;
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">\n`;
  svgContent += `<defs>\n  <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat" gradientTransform="scale(${gradientLoopCount},1)">\n`;
  const stops = [0, 0.33, 0.67, 1];
  for (let i = 0; i < colors.length; i++) {
    svgContent += `    <stop offset="${stops[i] * 100}%" stop-color="${colors[i]}" />\n`;
  }
  svgContent += `  </linearGradient>\n</defs>\n`;
  
  for (let curveIndex = 0; curveIndex < num_curves; curveIndex++) {
    const curve_offset = offset_rad * curveIndex;
    let pathData = "";
    let firstPoint = true;
    for (let t = 0; t <= total_t; t += t_step) {
      const t_eff = t + curve_offset;
      let pt = computePoint(R, r, d, t_eff);
      pt.x += centerX;
      pt.y += centerY;
      const dx = pt.x - centerX, dy = pt.y - centerY;
      const rotatedX = centerX + dx * Math.cos(globalRot) - dy * Math.sin(globalRot);
      const rotatedY = centerY + dx * Math.sin(globalRot) + dy * Math.cos(globalRot);
      let angle = Math.atan2(rotatedY - centerY, rotatedX - centerX);
      let r_orig = Math.sqrt((rotatedX - centerX) ** 2 + (rotatedY - centerY) ** 2);
      let s = Math.sin(baseDispFreq * angle + dispPhaseRad);
      let mod = Math.sign(s) * Math.pow(Math.abs(s), dispExp) * dispAmpToUse;
      let new_r = r_orig + mod;
      let finalX = centerX + new_r * Math.cos(angle);
      let finalY = centerY + new_r * Math.sin(angle);
      if (firstPoint) { pathData += `M ${finalX} ${finalY} `; firstPoint = false; }
      else { pathData += `L ${finalX} ${finalY} `; }
    }
    pathData += "Z";
    svgContent += `<path d="${pathData}" stroke="url(#lineGradient)" fill="none" stroke-width="${thickness}" />\n`;
  }
  svgContent += `</svg>`;
  
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "guilloche.svg";
  link.click();
}
