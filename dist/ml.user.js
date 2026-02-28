
// ==UserScript==
// @name        ML
// @match       https://wplace.live/*
// @grant       none
// @inject-into page
// @run-at      document-start
// ==/UserScript==

(() => {
  // src/state.js
  var state = { id: null, tx: 0, ty: 0, px: 0, py: 0, w: 0, h: 0, e: 0 };
  var TILE_SIZE = 1e3;
  var DRAW_MULT = 3;

  // src/draw.js
  var sourceCanvas;
  var M = Math;
  async function drawTemplateOnTile(tileBlob, tileCoords) {
    const [tX, tY] = tileCoords, S = state, T = TILE_SIZE, D2 = DRAW_MULT, dZ = T * D2;
    const bitmap = await createImageBitmap(tileBlob), canvas = document.createElement("canvas");
    canvas.width = canvas.height = dZ;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = 0;
    ctx.drawImage(bitmap, 0, 0, dZ, dZ);
    const tWSX = S.tx * T + S.px, tWSY = S.ty * T + S.py, cTWSX = tX * T, cTWSY = tY * T;
    const oX = M.max(0, cTWSX - tWSX), oY = M.max(0, cTWSY - tWSY);
    const dW = M.min(S.w - oX, T - (tWSX + oX - cTWSX)), dH = M.min(S.h - oY, T - (tWSY + oY - cTWSY));
    if (!sourceCanvas) sourceCanvas = document.createElement("canvas"), sourceCanvas.width = S.w, sourceCanvas.height = S.h, sourceCanvas.getContext("2d").putImageData(S.id, 0, 0);
    if (dW > 0 && dH > 0) {
      const temp = document.createElement("canvas"), w = dW * D2, h = dH * D2;
      temp.width = w;
      temp.height = h;
      const tCtx = temp.getContext("2d");
      tCtx.imageSmoothingEnabled = 0;
      tCtx.drawImage(sourceCanvas, oX, oY, dW, dH, 0, 0, w, h);
      const iD = tCtx.getImageData(0, 0, w, h), d = iD.data;
      for (let i = 0; i < d.length; i += 4) if (i / 4 % w % D2 !== 1 || M.floor(i / 4 / w) % D2 !== 1) d[i + 3] = 0;
      tCtx.putImageData(iD, 0, 0);
      ctx.drawImage(temp, M.max(0, tWSX - cTWSX) * D2, M.max(0, tWSY - cTWSY) * D2);
    }
    return new Promise((r) => canvas.toBlob(r));
  }

  // src/fetchProxy.js
  function installFetchHook() {
    const oF = window.fetch;
    window.fetch = async function(...a) {
      const r = await oF.apply(this, a);
      const c = r.clone();
      const u = (a[0].url || a[0]) + "";
      const ct = c.headers.get("content-type") || "";
      if (ct.includes("image/") && u.includes("/tiles/") && u.endsWith(".png")) {
        const m = u.match(/\/tiles\/(\d+)\/(\d+)\.png/);
        if (!m || !state.e || !state.id) return r;
        const tX = +m[1], tY = +m[2];
        const eTX = Math.floor((state.tx * TILE_SIZE + state.px + state.w - 1) / TILE_SIZE);
        const eTY = Math.floor((state.ty * TILE_SIZE + state.py + state.h - 1) / TILE_SIZE);
        if (tX < state.tx || tX > eTX || tY < state.ty || tY > eTY) return r;
        try {
          const p = await drawTemplateOnTile(await c.blob(), [tX, tY]);
          return new Response(p, { headers: c.headers, status: r.status, statusText: r.statusText });
        } catch {
          return r;
        }
      }
      return r;
    };
  }

  // src/ui.js
  var D = document;
  var $ = (id) => D.getElementById(id);
  var C = (t) => D.createElement(t);
  function ensureStyle() {
    if ($("ms")) return;
    const s = C("style");
    s.id = "ms";
    s.textContent = ".p{position:fixed;z-index:9;right:12px;bottom:12px;width:200px;background:#111;color:#fff;border:1px solid #e33;font:12px system-ui}.p *{box-sizing:border-box}.h{display:flex;align-items:center;justify-content:space-between;padding:6px;background:#111}#h{touch-action:none;user-select:none}.tl{color:#e33}.m{width:22px;height:22px;border:none;background:#333;color:#fff}.c{padding:8px}.g{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 6px}.i{width:100%;min-width:0;padding:6px;border:1px solid #333;background:#000;color:#ddd}.b{width:100%;padding:6px;border:none;color:#fff;font-size:11px;margin:0 0 4px}.bp{background:#e33}.bs{background:#555}";
    D.head.appendChild(s);
  }
  function createUI() {
    ensureStyle();
    const panel = C("div");
    panel.id = "m";
    panel.className = "p";
    panel.innerHTML = '<div id="h" class="h"><div class="tl">ML</div><button id="z" class="m">-</button></div><div id="c" class="c"><div class="g"><input id="x" class="i" placeholder="tX"/><input id="y" class="i" placeholder="tY"/><input id="px" class="i" placeholder="pX"/><input id="py" class="i" placeholder="pY"/></div><button id="s" class="b bp">Load Image</button><button id="t" class="b bs">OFF</button></div>';
    D.body.appendChild(panel);
    const header = $("h"), content = $("c"), btnMin = $("z"), inputX = $("x"), inputY = $("y"), inputPX = $("px"), inputPY = $("py"), btnSel = $("s"), btnTog = $("t");
    btnMin.onclick = () => {
      const shown = content.style.display !== "none";
      content.style.display = shown ? "none" : "block";
      btnMin.textContent = shown ? "+" : "-";
    };
    btnSel.onclick = () => {
      const input = C("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const match = file.name.match(/^(\d+)-(\d+)-(\d+)-(\d+)/);
        if (match) {
          inputX.value = match[1];
          inputY.value = match[2];
          inputPX.value = match[3];
          inputPY.value = match[4];
        }
        const img = new Image();
        img.onload = () => {
          const canvas = C("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          state.id = ctx.getImageData(0, 0, img.width, img.height);
          state.w = img.width;
          state.h = img.height;
        };
        img.src = URL.createObjectURL(file);
      };
      input.click();
    };
    btnTog.onclick = () => {
      if (!state.e) {
        state.tx = +inputX.value || 0;
        state.ty = +inputY.value || 0;
        state.px = +inputPX.value || 0;
        state.py = +inputPY.value || 0;
        if (!state.id) return;
      }
      state.e = !state.e;
      btnTog.textContent = state.e ? "ON" : "OFF";
      btnTog.classList.toggle("bp", state.e);
      btnTog.classList.toggle("bs", !state.e);
    };
    let isDragging = false, oX, oY;
    const start = (cX, cY) => {
      const r = panel.getBoundingClientRect();
      oX = cX - r.left;
      oY = cY - r.top;
      isDragging = true;
    };
    const move = (cX, cY) => {
      if (isDragging) {
        panel.style.left = cX - oX + "px";
        panel.style.top = cY - oY + "px";
        panel.style.bottom = "auto";
      }
    };
    if ("onpointerdown" in window) {
      header.onpointerdown = (e) => {
        if (e.target.id !== "z") {
          start(e.clientX, e.clientY);
          e.preventDefault();
        }
      };
      D.onpointermove = (e) => move(e.clientX, e.clientY);
      D.onpointerup = () => isDragging = false;
    }
    btnMin.onpointerdown = (e) => e.stopPropagation();
  }
  function initUI() {
    const run = () => setTimeout(createUI, 1e3);
    D.readyState === "loading" ? D.addEventListener("DOMContentLoaded", run) : run();
  }

  // src/index.js
  installFetchHook();
  initUI();
})();
