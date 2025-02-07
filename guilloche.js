const canvas = document.getElementById("guillocheCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 800;

// Helper: update display spans.
function updateDisplay(id, value) {
  document.getElementById(id).textContent = value;
}

// Helper: Euclidean distance between two points.
function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// Color helpers.
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  return {
    r: parseInt(hex.substring(0,2), 16),
    g: parseInt(hex.substring(2,4), 16),
    b: parseInt(hex.substring(4,6), 16)
  };
}

function rgbToHex(r, g, b) {
  const toHex = (c) => { let hex = c.toString(16); return hex.length === 1 ? "0" + hex : hex; };
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

// Compute spirograph point using standard equations.
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

/**
 * Draws the Guilloché pattern and then applies a polar displacement to each point.
 *
 * New displacement parameters:
 * - dispAmp: Displacement Amplitude.
 * - dispFreq: Displacement Frequency.
 * - dispPhase: Displacement Phase (in degrees).
 * - dispExp: Displacement Exponent.
 */
function drawGuilloche(R, r, d, num_curves, offset_deg, t_range_rotations, t_step, global_rotation_deg, thickness, gradientLoopCount, colors, dispAmp, dispFreq, dispPhase, dispExp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = thickness;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const total_t = t_range_rotations * 2 * Math.PI;
  const offset_rad = offset_deg * Math.PI / 180;
  const globalRot = global_rotation_deg * Math.PI / 180;
  const dispPhaseRad = dispPhase * Math.PI / 180;
  
  // For each layered curve.
  for (let curveIndex = 0; curveIndex < num_curves; curveIndex++) {
    const curve_offset = offset_rad * curveIndex;
    let points = [];
    // Compute base points along the curve.
    for (let t = 0; t <= total_t; t += t_step) {
      const t_eff = t + curve_offset;
      let pt = computePoint(R, r, d, t_eff);
      // Translate to canvas center.
      pt.x += centerX;
      pt.y += centerY;
      // Apply global rotation about canvas center.
      const dx = pt.x - centerX;
      const dy = pt.y - centerY;
      const rotatedX = centerX + dx * Math.cos(globalRot) - dy * Math.sin(globalRot);
      const rotatedY = centerY + dx * Math.sin(globalRot) + dy * Math.cos(globalRot);
      
      // Now apply polar displacement:
      let angle = Math.atan2(rotatedY - centerY, rotatedX - centerX);
      let r_orig = Math.sqrt((rotatedX - centerX) ** 2 + (rotatedY - centerY) ** 2);
      let s = Math.sin(dispFreq * angle + dispPhaseRad);
      let mod = Math.sign(s) * Math.pow(Math.abs(s), dispExp) * dispAmp;
      let new_r = r_orig + mod;
      let finalX = centerX + new_r * Math.cos(angle);
      let finalY = centerY + new_r * Math.sin(angle);
      points.push({ x: finalX, y: finalY });
    }
    
    // Compute total curve length for gradient mapping.
    let totalLength = 0;
    let segLengths = [];
    for (let i = 0; i < points.length - 1; i++) {
      const segLen = distance(points[i], points[i + 1]);
      segLengths.push(segLen);
      totalLength += segLen;
    }
    
    // Draw each segment with a color from the looping gradient.
    let cumulativeLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const segLen = segLengths[i];
      const pos = (cumulativeLength + segLen / 2) / totalLength;
      // Map pos to a gradient parameter that loops gradientLoopCount times.
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

/**
 * Updates the drawing based on current control values.
 * Also calculates the perfect closure (number of rotations for seamless loop).
 */
function update() {
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
  // Secondary (displacement) parameters.
  const dispAmp = parseFloat(document.getElementById("dispAmp").value);
  const dispFreq = parseFloat(document.getElementById("dispFreq").value);
  const dispPhase = parseFloat(document.getElementById("dispPhase").value);
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
  updateDisplay("dispAmp_val", dispAmp);
  updateDisplay("dispFreq_val", dispFreq);
  updateDisplay("dispPhase_val", dispPhase);
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
  
  // Draw the pattern with displacement applied.
  drawGuilloche(R, r, d, num_curves, offset_deg, t_range_rotations, t_step, global_rotation_deg, thickness, gradientLoopCount, colors, dispAmp, dispFreq, dispPhase, dispExp);
}

/**
 * Exports the current pattern as an SVG file.
 * The SVG uses a repeating linear gradient for the stroke.
 * The same polar displacement is applied to the generated path.
 */
function exportSVG() {
  // (For brevity, this export function follows similar logic as canvas drawing.)
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
  const dispAmp = parseFloat(document.getElementById("dispAmp").value);
  const dispFreq = parseFloat(document.getElementById("dispFreq").value);
  const dispPhase = parseFloat(document.getElementById("dispPhase").value);
  const dispExp = parseFloat(document.getElementById("dispExp").value);
  
  const centerX = 400, centerY = 400;
  const total_t = t_range_rotations * 2 * Math.PI;
  const offset_rad = offset_deg * Math.PI / 180;
  const globalRot = global_rotation_deg * Math.PI / 180;
  const dispPhaseRad = dispPhase * Math.PI / 180;
  
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">\n`;
  svgContent += `<defs>\n  <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat" gradientTransform="scale(${gradientLoopCount},1)">\n`;
  const stops = [0, 0.33, 0.67, 1];
  for (let i = 0; i < colors.length; i++) {
    svgContent += `    <stop offset="${stops[i] * 100}%" stop-color="${colors[i]}" />\n`;
  }
  svgContent += `  </linearGradient>\n</defs>\n`;
  
  // For each layered curve.
  for (let curveIndex = 0; curveIndex < num_curves; curveIndex++) {
    const curve_offset = offset_rad * curveIndex;
    let pathData = "";
    let firstPoint = true;
    for (let t = 0; t <= total_t; t += t_step) {
      const t_eff = t + curve_offset;
      let pt = computePoint(R, r, d, t_eff);
      pt.x += centerX;
      pt.y += centerY;
      // Global rotation.
      const dx = pt.x - centerX, dy = pt.y - centerY;
      const rotatedX = centerX + dx * Math.cos(globalRot) - dy * Math.sin(globalRot);
      const rotatedY = centerY + dx * Math.sin(globalRot) + dy * Math.cos(globalRot);
      // Apply displacement.
      let angle = Math.atan2(rotatedY - centerY, rotatedX - centerX);
      let r_orig = Math.sqrt((rotatedX - centerX) ** 2 + (rotatedY - centerY) ** 2);
      let s = Math.sin(dispFreq * angle + dispPhaseRad);
      let mod = Math.sign(s) * Math.pow(Math.abs(s), dispExp) * dispAmp;
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

// Initial drawing.
update();
