import type { Place } from "@/data/types";
import { Icon } from "./Icon";

const W = 360;
const H = 220;
const PAD = 34;

/** 旅程の回る順番を線でつないだ小さな地図。道の形ではなく、位置関係だけを示す */
export function RouteMap({ stops }: { stops: Place[] }) {
  if (stops.length < 2) return null;
  const lat0 = (stops.reduce((n, p) => n + p.lngLat[1], 0) / stops.length) * (Math.PI / 180);
  const raw = stops.map((p) => [p.lngLat[0] * Math.cos(lat0), -p.lngLat[1]] as const);
  const xs = raw.map((r) => r[0]);
  const ys = raw.map((r) => r[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((W - PAD * 2) / (x1 - x0 || 1), (H - PAD * 2) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * k) / 2;
  const oy = (H - (y1 - y0) * k) / 2;
  const pts = raw.map(([x, y]) => [ox + (x - x0) * k, oy + (y - y0) * k] as const);

  // 直線距離の合計(移動のおおよその目安)
  const km = stops.slice(1).reduce((n, p, i) => n + distanceKm(stops[i].lngLat, p.lngLat), 0);

  const ll = (p: Place) => `${p.lngLat[1]},${p.lngLat[0]}`;
  const gmaps =
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${ll(stops[0])}&destination=${ll(stops[stops.length - 1])}` +
    (stops.length > 2 ? `&waypoints=${encodeURIComponent(stops.slice(1, -1).map(ll).join("|"))}` : "");

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-line bg-wash">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`回る順番の地図(${stops.length}か所)`}>
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#e8502e" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
          {pts.map(([x, y], i) => (
            <g key={stops[i].id}>
              <circle cx={x} cy={y} r="12" fill={stops[i].category === "stay" ? "#16181d" : "#e8502e"} stroke="#ffffff" strokeWidth="2.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-mute">
          全{stops.length}か所 ・ 直線でおよそ <span className="num font-bold text-ink2">{km < 10 ? km.toFixed(1) : Math.round(km)}km</span>
        </p>
        <a
          href={gmaps}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold"
        >
          Googleマップで道順
          <Icon name="external" className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function distanceKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
