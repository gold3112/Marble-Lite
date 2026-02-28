import { state, TILE_SIZE } from './state.js';
import { drawTemplateOnTile } from './draw.js';

export function installFetchHook() {
  const oF = window.fetch;
  window.fetch = async function (...a) {
    const r = await oF.apply(this, a);
    const c = r.clone();
    const u = (a[0].url || a[0]) + '';
    const ct = c.headers.get('content-type') || '';

    if (ct.includes('image/') && u.includes('/tiles/') && u.endsWith('.png')) {
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
