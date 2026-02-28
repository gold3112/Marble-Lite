import { state, TILE_SIZE, DRAW_MULT } from './state.js';

let sourceCanvas, M = Math;

export async function drawTemplateOnTile(tileBlob, tileCoords) {
  const [tX, tY] = tileCoords, S = state, T = TILE_SIZE, D = DRAW_MULT, dZ = T * D;
  const bitmap = await createImageBitmap(tileBlob), canvas = document.createElement('canvas');
  canvas.width = canvas.height = dZ;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = 0;
  ctx.drawImage(bitmap, 0, 0, dZ, dZ);

  const tWSX = S.tx * T + S.px, tWSY = S.ty * T + S.py, cTWSX = tX * T, cTWSY = tY * T;
  const oX = M.max(0, cTWSX - tWSX), oY = M.max(0, cTWSY - tWSY);
  const dW = M.min(S.w - oX, T - (tWSX + oX - cTWSX)), dH = M.min(S.h - oY, T - (tWSY + oY - cTWSY));

  if (!sourceCanvas) sourceCanvas = document.createElement('canvas'), sourceCanvas.width = S.w, sourceCanvas.height = S.h, sourceCanvas.getContext('2d').putImageData(S.id, 0, 0);

  if (dW > 0 && dH > 0) {
    const temp = document.createElement('canvas'), w = dW * D, h = dH * D;
    temp.width = w; temp.height = h;
    const tCtx = temp.getContext('2d');
    tCtx.imageSmoothingEnabled = 0;
    tCtx.drawImage(sourceCanvas, oX, oY, dW, dH, 0, 0, w, h);

    const iD = tCtx.getImageData(0, 0, w, h), d = iD.data;
    for (let i = 0; i < d.length; i += 4) if (((i / 4) % w) % D !== 1 || M.floor((i / 4) / w) % D !== 1) d[i + 3] = 0;
    tCtx.putImageData(iD, 0, 0);
    ctx.drawImage(temp, M.max(0, tWSX - cTWSX) * D, M.max(0, tWSY - cTWSY) * D);
  }

  return new Promise(r => canvas.toBlob(r));
}

export const resetSourceCache = () => sourceCanvas = 0;
