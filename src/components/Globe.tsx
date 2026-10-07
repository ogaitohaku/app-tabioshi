"use client";
// 指で回せて拡大できる地球儀。d3-geo の正射図法でキャンバスに描き、ピンは HTML で重ねる。
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import type { Place, Video } from "@/data/types";
import { Icon } from "./Icon";
import { Visual } from "./Visual";

type Land = { world: number[][][][]; ea: number[][][][]; japan: number[][][][] };
type Cam = { lng: number; lat: number; k: number };

const CITIES: [string, number, number, number][] = [
  ["東京", 139.69, 35.69, 2.2], ["大阪", 135.5, 34.69, 2.6], ["札幌", 141.35, 43.06, 2.6], ["福岡", 130.4, 33.59, 2.6],
  ["那覇", 127.68, 26.21, 2.6], ["名古屋", 136.91, 35.18, 4], ["仙台", 140.87, 38.27, 4], ["広島", 132.46, 34.39, 5],
  ["金沢", 136.65, 36.56, 5], ["鹿児島", 130.56, 31.6, 5], ["別府", 131.49, 33.28, 40], ["尾道", 133.2, 34.41, 40],
  ["会津若松", 139.93, 37.5, 30], ["只見", 139.32, 37.35, 30], ["小樽", 141.0, 43.19, 40],
];
const LABELS: [string, number, number, number, number, boolean][] = [
  ["日本", 138.2, 36.6, 1.2, 4, true], ["太平洋", 146, 30, 1.2, 9, false], ["日本海", 134.5, 40, 2, 12, false],
  ["東シナ海", 126, 30, 2, 9, false], ["韓国", 127.9, 36.4, 2, 30, true], ["中国", 112, 34, 1, 9, true], ["ロシア", 132, 48.5, 1.5, 9, true],
];
const NEAR = 28; // この倍率より寄ると、エリアのピンから個別のスポットのピンに切り替える
const MAX_K = 5000;

export function Globe({ videos, places }: { videos: Video[]; places: Place[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const pinRefs = useRef(new Map<string, HTMLElement>());
  const api = useRef<{ flyTo: (c: Cam, ms?: number) => void; fitArea: (id: string) => void; japan: () => void; zoom: (f: number) => void } | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [hint, setHint] = useState(true);

  const areaPlaces = useMemo(() => (area ? places.filter((p) => p.videoId === area) : []), [area, places]);

  useEffect(() => {
    const box = boxRef.current!;
    const cv = cvRef.current!;
    const ctx = cv.getContext("2d")!;
    let land: Land | null = null;
    let W = 0, H = 0, base = 1, raf = 0, anim = 0, lastArea: string | null = null;
    const cam: Cam = { lng: 120, lat: 20, k: 1 };
    const proj = geoOrthographic().precision(0.4);
    const path = geoPath(proj, ctx);
    const grat = geoGraticule10();
    const font = getComputedStyle(document.body).fontFamily;

    const size = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = Math.min(W, H) * 0.42;
    };
    const setProj = () => proj.rotate([-cam.lng, -cam.lat]).scale(base * cam.k).translate([W / 2, H / 2]).clipExtent([[-2, -2], [W + 2, H + 2]]);
    const visible = (ll: [number, number]) => geoDistance(ll, [cam.lng, cam.lat]) < Math.PI / 2 - 0.02;

    const draw = () => {
      raf = 0;
      setProj();
      ctx.clearRect(0, 0, W, H);
      const k = cam.k;
      if (k < 6) {
        const r = base * k, g = ctx.createRadialGradient(W / 2, H / 2, r * 0.9, W / 2, H / 2, r * 1.12);
        g.addColorStop(0, "rgba(120,170,220,.35)"); g.addColorStop(1, "rgba(120,170,220,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, r * 1.12, 0, 7); ctx.fill();
      }
      ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = "#A9D4EE"; ctx.fill();
      if (k < 8) { ctx.beginPath(); path(grat); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.7; ctx.stroke(); }
      if (land) {
        ctx.fillStyle = "#F3F1EC";
        if (k < 3) { ctx.beginPath(); path({ type: "MultiPolygon", coordinates: land.world }); ctx.fill(); }
        ctx.beginPath(); path({ type: "MultiPolygon", coordinates: land.ea }); ctx.fill();
        ctx.beginPath(); path({ type: "MultiPolygon", coordinates: land.japan });
        ctx.fillStyle = "#FBFAF7"; ctx.fill(); ctx.strokeStyle = "#9FBFD6"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const [n, lng, lat, kmin, kmax, isLand] of LABELS) {
        if (k < kmin || k > kmax || !visible([lng, lat])) continue;
        const [x, y] = proj([lng, lat])!;
        ctx.font = isLand ? `700 ${n === "日本" ? 15 : 12}px ${font}` : `italic 500 12px ${font}`;
        ctx.fillStyle = isLand ? "rgba(60,66,76,.55)" : "rgba(40,100,150,.6)";
        ctx.fillText(n, x, y);
      }
      ctx.textAlign = "left";
      for (const [n, lng, lat, kmin] of CITIES) {
        if (k < kmin || !visible([lng, lat])) continue;
        const [x, y] = proj([lng, lat])!;
        if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#7A8794"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.stroke();
        ctx.font = `500 11.5px ${font}`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.strokeText(n, x + 6, y); ctx.fillStyle = "#4B5560"; ctx.fillText(n, x + 6, y);
      }
      // ピンの位置
      const near = k >= NEAR;
      // 近すぎるエリアのピンはまとめて「+1」と出す(押して寄ると分かれる)
      const placed: { x: number; y: number; id: string; extra: number }[] = [];
      for (const v of videos) {
        const el = pinRefs.current.get(`a:${v.id}`);
        if (!el) continue;
        let show = !near && k >= 1.6 && visible(v.center);
        if (show) {
          const [x, y] = proj(v.center)!;
          const hit = placed.find((q) => Math.hypot(q.x - x, q.y - y) < 46);
          if (hit) { hit.extra += 1; show = false; }
          else { placed.push({ x, y, id: v.id, extra: 0 }); el.style.transform = `translate(${x}px,${y}px)`; }
        }
        el.hidden = !show;
      }
      for (const v of videos) {
        const badge = pinRefs.current.get(`b:${v.id}`);
        if (!badge) continue;
        const extra = placed.find((q) => q.id === v.id)?.extra ?? 0;
        badge.hidden = extra === 0;
        badge.textContent = `+${extra}`;
      }
      for (const p of places) {
        const el = pinRefs.current.get(`p:${p.id}`);
        if (!el) continue;
        let show = near && visible(p.lngLat);
        if (show) {
          const [x, y] = proj(p.lngLat)!;
          show = x > -40 && x < W + 40 && y > -20 && y < H + 60;
          if (show) el.style.transform = `translate(${x}px,${y}px)`;
        }
        el.hidden = !show;
      }
      // いま寄っているエリア
      let focus: string | null = null;
      if (near) {
        let best = Infinity;
        for (const v of videos) { const d = geoDistance(v.center, [cam.lng, cam.lat]); if (d < best) { best = d; focus = v.id; } }
        if (best > 0.03) focus = null;
      }
      if (focus !== lastArea) { lastArea = focus; setArea(focus); }
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(draw); };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flyTo = (to: Cam, ms = 1100) => {
      cancelAnimationFrame(anim);
      const from = { ...cam };
      const ip = geoInterpolate([from.lng, from.lat], [to.lng, to.lat]);
      const bump = Math.min(2.5, geoDistance([from.lng, from.lat], [to.lng, to.lat]) * 6);
      const lk0 = Math.log(from.k), lk1 = Math.log(to.k), t0 = performance.now();
      if (reduced) { Object.assign(cam, to); req(); return; }
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        [cam.lng, cam.lat] = ip(e);
        cam.k = Math.exp(lk0 + (lk1 - lk0) * e - bump * Math.sin(Math.PI * e));
        draw();
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    const fitK = (spanDeg: number) => Math.min(MAX_K, Math.max(1, (Math.min(W, H) * 0.62) / ((spanDeg * Math.PI) / 180) / base));
    const fitArea = (id: string) => {
      const ll = places.filter((p) => p.videoId === id).map((p) => p.lngLat);
      const xs = ll.map((p) => p[0]), ys = ll.map((p) => p[1]);
      const span = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 1.2, 0.05);
      setHint(false);
      flyTo({ lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2, k: fitK(Math.max(0.16, span * 1.9)) });
    };
    const japan = () => flyTo({ lng: 137.5, lat: 37.6, k: fitK(17) });
    const zoom = (f: number) => flyTo({ ...cam, k: Math.min(MAX_K, Math.max(0.8, cam.k * f)) }, 350);
    api.current = { flyTo, fitArea, japan, zoom };

    // 操作: ドラッグで回す(慣性つき)、ホイール・ピンチ・ダブルタップで指の位置に向かって拡大
    const pts = new Map<number, [number, number]>();
    let last: [number, number] = [0, 0], vel: [number, number] = [0, 0], lastT = 0;
    let pinch: { d: number; m: [number, number] } | null = null;
    const local = (e: PointerEvent | WheelEvent | MouseEvent): [number, number] => {
      const r = box.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const zoomAt = (f: number, x: number, y: number) => {
      setProj();
      const a = proj.invert!([x, y]);
      cam.k = Math.min(MAX_K, Math.max(0.8, cam.k * f));
      setProj();
      const b = proj.invert!([x, y]);
      if (a && b && cam.k > 1.5) { cam.lng += a[0] - b[0]; cam.lat = Math.max(-80, Math.min(80, cam.lat + a[1] - b[1])); }
      req();
    };
    const pan = (dx: number, dy: number) => {
      const sc = base * cam.k;
      cam.lng -= ((dx / sc) * 180) / Math.PI / Math.max(0.2, Math.cos((cam.lat * Math.PI) / 180));
      cam.lat = Math.max(-80, Math.min(80, cam.lat + ((dy / sc) * 180) / Math.PI));
      req();
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      cancelAnimationFrame(anim);
      box.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      last = local(e); vel = [0, 0]; lastT = performance.now();
      setHint(false);
      if (pts.size === 2) {
        const [p, q] = [...pts.values()];
        pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), m: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] };
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const pnt = local(e);
      pts.set(e.pointerId, pnt);
      if (pts.size === 2 && pinch) {
        const [p, q] = [...pts.values()];
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        const m: [number, number] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        pan(m[0] - pinch.m[0], m[1] - pinch.m[1]);
        zoomAt(d / pinch.d, m[0], m[1]);
        pinch = { d, m };
        return;
      }
      const dx = pnt[0] - last[0], dy = pnt[1] - last[1], now = performance.now();
      pan(dx, dy);
      vel = [dx / Math.max(1, now - lastT), dy / Math.max(1, now - lastT)];
      last = pnt; lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 1) last = [...pts.values()][0];
      if (pts.size === 0 && performance.now() - lastT < 60 && Math.hypot(...vel) > 0.15) {
        let [vx, vy] = vel, t = performance.now();
        const glide = (now: number) => {
          const dt = now - t; t = now;
          pan(vx * dt, vy * dt); vx *= 0.92; vy *= 0.92;
          if (Math.hypot(vx, vy) > 0.02) anim = requestAnimationFrame(glide);
        };
        anim = requestAnimationFrame(glide);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(anim);
      setHint(false);
      const [x, y] = local(e);
      zoomAt(Math.exp(-e.deltaY * 0.0022), x, y);
    };
    const onDbl = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      const [x, y] = local(e);
      const k0 = cam.k, t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 300);
        zoomAt((k0 * Math.pow(2.2, t)) / cam.k, x, y);
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    box.addEventListener("pointerdown", onDown);
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", onUp);
    box.addEventListener("pointercancel", onUp);
    box.addEventListener("wheel", onWheel, { passive: false });
    box.addEventListener("dblclick", onDbl);
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(box);
    size();
    draw();

    let alive = true;
    fetch("/geo/land.json")
      .then((r) => r.json())
      .then((d: Land) => { if (!alive) return; land = d; req(); setTimeout(japan, 250); })
      .catch(() => { /* 地形が読めなくてもピンと海は出る */ });
    const hintTimer = setTimeout(() => setHint(false), 6000);

    return () => {
      alive = false;
      cancelAnimationFrame(anim); cancelAnimationFrame(raf); clearTimeout(hintTimer); ro.disconnect();
      box.removeEventListener("pointerdown", onDown); box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp); box.removeEventListener("pointercancel", onUp);
      box.removeEventListener("wheel", onWheel); box.removeEventListener("dblclick", onDbl);
    };
  }, [videos, places]);

  const setPin = (key: string) => (el: HTMLElement | null) => {
    if (el) pinRefs.current.set(key, el);
    else pinRefs.current.delete(key);
  };
  const areaVideo = videos.find((v) => v.id === area);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={boxRef}
        className="relative h-[min(62dvh,520px)] touch-none overflow-hidden rounded-3xl bg-[#e9f3fa] select-none"
        aria-label="地図。ドラッグで回転、ピンチやホイールで拡大できます"
      >
        <canvas ref={cvRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0">
          {videos.map((v) => (
            <button
              key={v.id}
              ref={setPin(`a:${v.id}`)}
              hidden
              type="button"
              onClick={() => api.current?.fitArea(v.id)}
              className="pointer-events-auto absolute top-0 left-0 -mt-14 -ml-6 flex flex-col items-center"
              aria-label={`${v.area}を拡大`}
            >
              <span className="relative h-12 w-12 rounded-full border-[3px] border-white shadow-lg">
                <span className="block h-full w-full overflow-hidden rounded-full">
                  <Visual visual={v.visual} />
                </span>
                <span ref={setPin(`b:${v.id}`)} hidden className="absolute -top-1 -right-2 rounded-full bg-shu px-1.5 text-[10px] leading-4 font-bold text-white" />
              </span>
              <span className="mt-0.5 rounded-full bg-white px-1.5 text-[10px] font-bold shadow">{v.area.split("・")[1]}</span>
            </button>
          ))}
          {places.map((p) => (
            <Link
              key={p.id}
              ref={setPin(`p:${p.id}`)}
              hidden
              href={`/places/${p.id}`}
              className="pointer-events-auto absolute top-0 left-0 -mt-8 -translate-x-1/2 rounded-full bg-white px-2 py-1 text-[11px] font-bold whitespace-nowrap shadow-md ring-1 ring-black/5"
            >
              {p.sponsored && <span className="mr-1 text-mute">PR</span>}
              {p.name}
            </Link>
          ))}
        </div>
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow">
            {areaVideo ? `${areaVideo.area} ・ ${areaPlaces.length}スポット` : `推しが行った場所 ・ ${videos.length}エリア`}
          </span>
          <button type="button" onClick={() => api.current?.japan()} className="shrink-0 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow">
            日本全体
          </button>
        </div>
        <div className="absolute right-3 bottom-8 flex flex-col overflow-hidden rounded-xl bg-white shadow">
          <button type="button" aria-label="拡大" onClick={() => api.current?.zoom(2)} className="grid h-10 w-10 place-items-center border-b border-line">
            <Icon name="plus" />
          </button>
          <button type="button" aria-label="縮小" onClick={() => api.current?.zoom(0.5)} className="grid h-10 w-10 place-items-center">
            <Icon name="minus" />
          </button>
        </div>
        {hint && (
          <span className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            指で回す・2本指で拡大
          </span>
        )}
        <span className="absolute bottom-2 left-3 text-[10px] text-ink2/70">地図データ: Natural Earth</span>
      </div>

      <div className="hscroll px-0">
        {areaVideo
          ? areaPlaces.map((p) => (
              <Link key={p.id} href={`/places/${p.id}`} className="flex w-60 gap-2 rounded-2xl border border-line bg-card p-2">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <Visual visual={p.visual} />
                </span>
                <span className="min-w-0 text-sm">
                  <b className="block truncate">{p.name}</b>
                  <span className="block truncate text-xs text-mute">{p.priceLabel}</span>
                </span>
              </Link>
            ))
          : videos.map((v) => (
              <button key={v.id} type="button" onClick={() => api.current?.fitArea(v.id)} className="flex w-60 gap-2 rounded-2xl border border-line bg-card p-2 text-left">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <Visual visual={v.visual} />
                </span>
                <span className="min-w-0 text-sm">
                  <b className="block truncate">{v.area}</b>
                  <span className="block text-xs text-mute">地図で見る</span>
                </span>
              </button>
            ))}
      </div>
    </div>
  );
}
