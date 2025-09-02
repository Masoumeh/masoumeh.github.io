export default function define(runtime, observer) {
//const { Canvg } = await import("https://cdn.jsdelivr.net/npm/canvg@4/dist/browser/canvg.min.js");
  const main = runtime.module();

  // ---- Chart ----
  main.variable(observer("chart")).define("chart", ["d3","width","height","data","format","DOM","color"], function(d3, width, height, data, format, DOM, color) {
    // Build hierarchy and layout
    const root = d3.treemap()
      .size([width, height])
      .paddingOuter(3)
      .paddingTop(19)
      .paddingInner(1)
      .round(true)
    (d3.hierarchy(data).sum(d => d.size || d.value || 0).sort((a,b)=>b.value-a.value));

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("font", "10px sans-serif");

    // Shadow filter like Observable demo
    const shadow = DOM.uid("shadow");
    svg.append("filter")
        .attr("id", shadow.id)
      .append("feDropShadow")
        .attr("flood-opacity", 0.3)
        .attr("dx", 0)
        .attr("stdDeviation", 3);

    const node = svg.selectAll("g")
      .data(d3.group(root, d => d.height))
      .join("g")
        .attr("filter", shadow)
      .selectAll("g")
      .data(d => d[1])
      .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("title")
        .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")} ${format(d.value)}`);

    node.append("rect")
        .attr("id", d => (d.nodeUid = DOM.uid("node")).id)
        .attr("fill", d => color(d.height))
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);

    node.append("clipPath")
        .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
      .append("use")
        .attr("xlink:href", d => d.nodeUid.href);

    // ---- Label helpers ----
    function normalizeName(s) {
      return String(s)
        .replace(/\bal-\s*/gi, 'al-')     // remove spaces after "al-"
        .replace(/\bal-/gi, 'al\u2011')   // non-breaking hyphen
        .replace(/\s+/g, ' ')
        .trim();
    }

    function wrapBySpaces(textSel, rawName, maxWidth, firstY = 13, lineEm = 1.1) {
  const words = normalizeName(rawName).split(' ').filter(Boolean);
  if (maxWidth <= 0 || !words.length) return { lines: 0, last: null };

  let line = [];
  let lines = 0;
  let tspan = textSel.append("tspan").attr("x", 3).attr("y", firstY);

  for (const w of words) {
    line.push(w);
    tspan.text(line.join(" "));
    if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
      line.pop();
      tspan.text(line.join(" "));
      line = [w];
      tspan = textSel.append("tspan")
        .attr("x", 3)
        .attr("dy", `${lineEm}em`)
        .text(w);
    }
  }
  lines = textSel.selectAll("tspan").size();
  return { lines, last: tspan };
}

// Fit a single-line label into (boxW x boxH):
//    - shrink font size down to minPx if needed
//    - if still too wide, ellipsize with "…"
function fitSingleLine(textSel, label, boxW, boxH, {maxPx=12, minPx=6, padX=3, padY=2} = {}) {
  if (boxW <= 0 || boxH <= 0) return;
  let fontPx = Math.min(maxPx, Math.max(minPx, Math.floor(boxH - 2)));
  const usableW = Math.max(1, boxW - padX*2);

  // baseline "alphabetic": set y to (padY + fontPx) to visually top-align
  textSel
    .attr("x", padX)
    .attr("y", padY + fontPx)
    .attr("font-size", fontPx)
    .text(label);

  while (textSel.node().getComputedTextLength() > usableW && fontPx > minPx) {
    fontPx -= 1;
    textSel.attr("font-size", fontPx).attr("y", padY + fontPx);
  }

  if (textSel.node().getComputedTextLength() > usableW) {
    let str = label;
    while (str.length > 4) {
      str = str.slice(0, -1);
      textSel.text(str + "…");
      if (textSel.node().getComputedTextLength() <= usableW) break;
    }
  }
}


   
// when creating each single-line label auto-fit label code:
node.append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)          // your fit routine can change this
  .attr("fill", "#000")
  .attr("clip-path", d => d.clipUid)  // clipping works after expansion above
  .each(function(d) {
    const text = d3.select(this);
    const w = d.x1 - d.x0, h = d.y1 - d.y0;
    const label = `${normalizeName(d.data.name)} ${format(d.value)}`;
    fitSingleLine(text, label, w, h, { maxPx: 12, minPx: 6, padX: 3, padY: 2 });
  });



    
    
    // Export function
    
// Robust loader (ESM first, UMD fallback). Keep this near exportPNG.
async function loadCanvg() {
  if (window.Canvg) return window.Canvg;
  try {
    const mod = await import("https://esm.sh/canvg@4");
    const Canvg = mod.Canvg || mod.default;
    if (Canvg) return Canvg;
  } catch {}
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/canvg@4/dist/browser/canvg.min.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  return window.Canvg;
}

// === EXACT-AS-SHOWN export (canvas) ==========================
async function exportPNG(svgNode, {
  filename   = "treemap.png",
  background = "#fff",
  scale      = 3,          // logical scale (multiplied by devicePixelRatio)
  dpi        = null,       // optional override: dpi/96 * DPR
  crop       = null        // {x,y,width,height} in SVG viewBox units
} = {}) {
  // Let layout & fonts settle so the draw uses on-screen metrics
  await new Promise(r => requestAnimationFrame(r));
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }

  // Use viewBox as the coordinate system
  const vb = svgNode.viewBox && svgNode.viewBox.baseVal;
  const W  = vb ? vb.width  : +svgNode.getAttribute("width");
  const H  = vb ? vb.height : +svgNode.getAttribute("height");
  if (!W || !H) throw new Error("SVG needs a viewBox or width/height.");

  // Export scale (hi-DPI)
  const DPR = window.devicePixelRatio || 1;
  const S   = (dpi ? (dpi / 96) : scale) * DPR;

  // Crop rect in *SVG units*
  const Cx = crop ? crop.x : 0;
  const Cy = crop ? crop.y : 0;
  const Cw = crop ? crop.width  : W;
  const Ch = crop ? crop.height : H;

  // Canvas setup
  const canvas = document.createElement("canvas");
  canvas.width  = Math.max(1, Math.round(Cw * S));
  canvas.height = Math.max(1, Math.round(Ch * S));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw in SVG coordinates, then scale once
  ctx.save();
  ctx.scale(S, S);
  ctx.translate(-Cx, -Cy);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic"; // matches SVG default

  // Helpers ----------------------------------------------------
  const parseTranslate = (node) => {
    // accumulate translate() from this <g> up to the root <svg>
    let x = 0, y = 0, n = node;
    while (n && n !== svgNode) {
      if (n.nodeType === 1) {
        const tr = n.getAttribute("transform");
        if (tr) {
          const m = /translate\(\s*([-\d.]+)(?:\s*,\s*([-\d.]+))?\s*\)/.exec(tr);
          if (m) { x += +m[1] || 0; y += +(m[2] ?? 0); }
        }
      }
      n = n.parentNode;
    }
    return { x, y };
  };

  const groups = svgNode.querySelectorAll("g");
  // Iterate in DOM order so z-order matches what you see
  groups.forEach(g => {
    const rect = g.querySelector(":scope > rect");
    const text = g.querySelector(":scope > text");
    if (!rect || !text) return;

    // Geometry of this cell
    const { x: gx, y: gy } = parseTranslate(g);
    const rw = +rect.getAttribute("width")  || 0;
    const rh = +rect.getAttribute("height") || 0;
    if (rw <= 0 || rh <= 0) return;

    // Skip if completely outside crop
    if (gx + rw < Cx || gy + rh < Cy || gx > Cx + Cw || gy > Cy + Ch) return;

    // 1) Draw the rectangle (fill)
    const fill = rect.getAttribute("fill") || "#ccc";
    ctx.fillStyle = fill;
    ctx.fillRect(gx, gy, rw, rh);

    // 2) Clip to this rect (so label cannot spill)
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gy, rw, rh);
    ctx.clip();

    // 3) Draw the text exactly as rendered
    const cs = getComputedStyle(text);
    const fontSize = parseFloat(cs.fontSize) || 10;
    const fontWeight = cs.fontWeight && cs.fontWeight !== "normal" ? cs.fontWeight + " " : "";
    const fontFamily = cs.fontFamily || "sans-serif";
    ctx.font = `${fontWeight}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = cs.fill || "#000";

    const tx = gx + (parseFloat(text.getAttribute("x")) || 0);
    const ty = gy + (parseFloat(text.getAttribute("y")) || 0);

    // If your text has just one line (as in your latest code), this is enough:
    ctx.fillText(text.textContent || "", tx, ty);

    // If you ever go back to multi-<tspan>, uncomment to render each line:
    // const tspans = text.querySelectorAll(":scope > tspan");
    // if (tspans.length) {
    //   tspans.forEach(t => {
    //     const lx = tx + (parseFloat(t.getAttribute("dx")) || 0) + (parseFloat(t.getAttribute("x")) || 0);
    //     const ly = ty + (parseFloat(t.getAttribute("dy")) || 0) + (parseFloat(t.getAttribute("y")) || 0);
    //     ctx.fillText(t.textContent || "", isNaN(lx) ? tx : lx, isNaN(ly) ? ty : ly);
    //   });
    // }

    // 4) Unclip for the next cell
    ctx.restore();
  });

  ctx.restore();

  // Download
  await new Promise(resolve => canvas.toBlob(b => {
    const a = document.createElement("a");
    a.download = filename;
    a.href = URL.createObjectURL(b);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    resolve();
  }, "image/png"));
}



// Export exactly-as-rendered PNG; crop is in *SVG viewBox units*
async function exportExactPNG({ filename = "treemap.png", scale = 3, background = "#fff", crop = null } = {}) {
  await ensureSaveSvg();
  // make sure layout/fonts have settled so the clone matches screen
  await new Promise(r => requestAnimationFrame(r));
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }

  const opts = {
    backgroundColor: background,
    scale,                     // try 2–4 for high-res
    encoderOptions: 1.0
  };
  if (crop) {
    opts.left   = Math.max(0, Math.floor(crop.x));
    opts.top    = Math.max(0, Math.floor(crop.y));
    opts.width  = Math.max(1, Math.ceil(crop.width));
    opts.height = Math.max(1, Math.ceil(crop.height));
  }

  // IMPORTANT: pass the actual <svg> node you render
  window.saveSvgAsPng(svg.node(), filename, opts);
}



const overlay = svg.append("g").attr("pointer-events", "all");
const sel = overlay.append("rect")
  .attr("fill", "rgba(0,0,0,0.08)")
  .attr("stroke", "#333")
  .attr("stroke-dasharray", "4 3")
  .attr("visibility", "hidden");

let dragStart = null, lastSel = null;

function clientToSvg(svgEl, cx, cy) {
  const pt = svgEl.createSVGPoint();
  pt.x = cx; pt.y = cy;
  const m = svgEl.getScreenCTM();
  if (!m) return null;
  return pt.matrixTransform(m.inverse());      // returns *viewBox-space* coords
}
function clampRect(x, y, w, h) {
  const vb = svg.node().viewBox.baseVal;
  const x0 = Math.max(vb.x, Math.min(x, vb.x + vb.width));
  const y0 = Math.max(vb.y, Math.min(y, vb.y + vb.height));
  const x1 = Math.max(vb.x, Math.min(x + w, vb.x + vb.width));
  const y1 = Math.max(vb.y, Math.min(y + h, vb.y + vb.height));
  return { x: Math.min(x0, x1), y: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0) };
}

svg.on("pointerdown", ev => {
  const p = clientToSvg(svg.node(), ev.clientX, ev.clientY);
  if (!p) return;
  dragStart = p; lastSel = null;
  sel.attr("x", p.x).attr("y", p.y).attr("width", 0).attr("height", 0).attr("visibility", "visible");
});
svg.on("pointermove", ev => {
  if (!dragStart) return;
  const p = clientToSvg(svg.node(), ev.clientX, ev.clientY);
  const r = clampRect(dragStart.x, dragStart.y, p.x - dragStart.x, p.y - dragStart.y);
  lastSel = r;
  sel.attr("x", r.x).attr("y", r.y).attr("width", r.width).attr("height", r.height);
});
svg.on("pointerup pointercancel", () => {
  if (!dragStart) return;
  dragStart = null; sel.attr("visibility", "hidden");
  if (lastSel && lastSel.width > 4 && lastSel.height > 4) {
    exportPNG(svg.node(), { scale: 3, filename: "treemap-selection.png", background: "#fff", crop: lastSel });
  }
});
//svg.on("dblclick", () => exportPNG(svg.node(), { scale: 3, filename: "treemap.png", background: "#fff" }));

// full page (e.g., dblclick)
svg.on("dblclick", () => exportPNG(svg.node(), { scale: 3, filename: "treemap.png", background: "#fff" }));

// selection (pointerup)
if (lastSel && lastSel.width > 4 && lastSel.height > 4) {
  exportPNG(svg.node(), { scale: 3, filename: "treemap-selection.png", background: "#fff", crop: lastSel });
}




// --- Buttons UI (top-right) ---
const ui = document.createElement("div");
ui.style.cssText = "position:fixed;top:8px;right:8px;z-index:9999;display:flex;gap:8px";
const btnFull = document.createElement("button");
const btnSel  = document.createElement("button");
btnFull.textContent = "Download Full (3×)";
btnSel.textContent  = "Download Selection (3×)";
btnSel.disabled = true;
btnFull.onclick = () => exportPNG(svg.node(), { scale: 3, filename: "treemap.png", background: "#fff" });
btnSel.onclick  = () => lastSelection && exportPNG(svg.node(), { scale: 3, filename: "treemap-selection.png", background: "#fff", crop: lastSelection });
document.body.appendChild(ui); ui.append(btnFull, btnSel);

return svg.node();

  });

  // ---- Data ----
  main.variable(observer("data")).define("data", function() {
    return fetch("./files/e65374209781891f37dea1e7a6e1c5e020a3009b8aedf113b4c80942018887a1176ad4945cf14444603ff91d3da371b3b0d72419fa8d2ee0f6e815732475d5de").then(r => r.json());
  });



  // ---- Layout/Style helpers ----
  main.variable(observer("width")).define("width", function(){ return window.innerWidth; });
  main.variable(observer("height")).define("height", function(){ return window.innerHeight; });
  main.variable(observer("format")).define("format", ["d3"], function(d3){ return d3.format(",d"); });
  main.variable(observer("color")).define("color", ["d3"], function(d3){ return d3.scaleSequential([8, 0], d3.interpolateMagma); });
  main.variable(observer("d3")).define("d3", ["require"], function(require){ return require("d3@6"); });

  return main;
}
