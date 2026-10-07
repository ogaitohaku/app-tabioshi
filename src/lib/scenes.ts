// 写真がまだない場所に描く、イメージ画像(手続き的に描いた風景)。
// 本物の写真が入ったら Visual.photo を使うので、これは仮の絵として残す。
import type { SceneName } from "@/data/types";

type Ctx = CanvasRenderingContext2D;

function rng(seed: number){ let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function ridge(ctx: Ctx, w: number, h: number, base: number, amp: number, seed: number, color: string, rough?: number){
  const r = rng(seed), ph = [r()*6, r()*6, r()*6];
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4){ const t = x / w; ctx.lineTo(x, base - amp * (0.55*Math.sin(t*3.1+ph[0]) + 0.3*Math.sin(t*7.3+ph[1]) + (rough||0.12)*Math.sin(t*19+ph[2]))); }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function glow(ctx: Ctx, x: number, y: number, r: number, color: string){ const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function lin(ctx: Ctx, h: number, stops: [number, string][], x?: number){ const g = x ? ctx.createLinearGradient(0, 0, x, 0) : ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number){ ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath(); }
const SCENES: Record<SceneName, (ctx: Ctx, w: number, h: number, s: number, view?: SceneName) => void> = {
  onsen(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#2E3A6B"],[0.45,"#C9707A"],[0.7,"#F3A766"],[1,"#F8D59A"]]); ctx.fillRect(0,0,w,h);
    const sx = w*(0.25+r()*0.5); glow(ctx, sx, h*0.58, h*0.5, "rgba(255,214,150,.75)");
    ctx.fillStyle = "#FFE3B0"; ctx.beginPath(); ctx.arc(sx, h*0.6, h*0.07, 0, 7); ctx.fill();
    ridge(ctx, w, h, h*0.6, h*0.16, s+1, "#7A5A7E"); ridge(ctx, w, h, h*0.7, h*0.12, s+2, "#4B3A5E"); ridge(ctx, w, h, h*0.82, h*0.06, s+3, "#2A2238", .3);
    for (let i = 0; i < 80; i++){ ctx.fillStyle = `rgba(255,${190+r()*50|0},120,${0.5+r()*0.5})`; ctx.fillRect(r()*w, h*0.8 + r()*h*0.2, 2+r()*2, 2+r()*2); }
    for (let i = 0; i < 9; i++){ const x = r()*w, y0 = h*(0.78+r()*0.1); for (let k = 0; k < 7; k++) glow(ctx, x + Math.sin(k*0.9+i)*h*0.04, y0 - k*h*0.06, h*(0.05+k*0.018), `rgba(255,245,235,${0.22-k*0.025})`); }
  },
  sea(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#5AA9E0"],[0.5,"#BFE3F5"],[0.56,"#EAF6FB"]]); ctx.fillRect(0,0,w,h);
    for (let i = 0; i < 4; i++) glow(ctx, r()*w, h*(0.1+r()*0.3), h*0.18, "rgba(255,255,255,.55)");
    ctx.fillStyle = lin(ctx, h, [[0.55,"#2B86BF"],[1,"#0F4F82"]]); ctx.fillRect(0, h*0.56, w, h*0.44);
    ctx.fillStyle = "#4F7F73"; for (let i = 0; i < 3; i++){ ctx.beginPath(); ctx.ellipse(r()*w, h*0.565, w*(0.15+r()*0.2), h*0.05, 0, Math.PI, 0); ctx.fill(); }
    const by = h*0.47, x1 = w*0.15, x2 = w*0.85; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = Math.max(2, h*0.008);
    ctx.beginPath(); ctx.moveTo(x1, by-h*0.12); ctx.lineTo(x1, by+h*0.09); ctx.moveTo(x2, by-h*0.12); ctx.lineTo(x2, by+h*0.09); ctx.stroke();
    ctx.lineWidth = Math.max(1, h*0.004); ctx.beginPath(); ctx.moveTo(0, by+h*0.03); ctx.quadraticCurveTo(x1, by-h*0.12, (x1+x2)/2, by+h*0.03); ctx.quadraticCurveTo(x2, by-h*0.12, w, by+h*0.03); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.fillRect(0, by+h*0.05, w, Math.max(2, h*0.012));
    for (let i = 0; i < 120; i++){ ctx.fillStyle = `rgba(255,255,255,${r()*0.5})`; ctx.fillRect(r()*w, h*0.6 + r()*h*0.4, 6+r()*14, 1.5); }
    ctx.fillStyle = "#3E6B4E"; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h*0.7); ctx.quadraticCurveTo(w*0.25, h*0.74, w*0.42, h); ctx.fill();
    const cols = ["#F4F1EA","#E9D9C4","#D5E4EA","#F2C9A0"];
    for (let i = 0; i < 14; i++){ const x = r()*w*0.32, y = h*(0.74+r()*0.2); ctx.fillStyle = cols[i%4]; ctx.fillRect(x, y, w*0.03, h*0.035); ctx.fillStyle = "#8A4A3A"; ctx.fillRect(x-1, y-h*0.01, w*0.03+2, h*0.012); }
  },
  snow(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#8EA6BF"],[0.6,"#DCE6EE"],[1,"#F4F7FA"]]); ctx.fillRect(0,0,w,h);
    ridge(ctx, w, h, h*0.5, h*0.18, s+5, "#B7C7D6"); ridge(ctx, w, h, h*0.58, h*0.14, s+6, "#EEF3F7"); ridge(ctx, w, h, h*0.66, h*0.1, s+7, "#5C7466", .35);
    for (let i = 0; i < 40; i++){ const x = r()*w, y = h*(0.6+r()*0.1); ctx.fillStyle = "#3E5448"; ctx.beginPath(); ctx.moveTo(x, y-h*0.06); ctx.lineTo(x-h*0.02, y); ctx.lineTo(x+h*0.02, y); ctx.fill(); }
    ctx.fillStyle = lin(ctx, h, [[0.7,"#4D7E86"],[1,"#2C5961"]]); ctx.fillRect(0, h*0.74, w, h*0.26);
    ctx.fillStyle = "#F4F7FA"; ctx.beginPath(); ctx.moveTo(0, h*0.74); ctx.quadraticCurveTo(w*0.5, h*0.79, w, h*0.74); ctx.lineTo(w, h*0.72); ctx.lineTo(0, h*0.72); ctx.fill();
    const y = h*0.62; ctx.strokeStyle = "#24343F"; ctx.lineWidth = Math.max(2, h*0.012); ctx.beginPath(); ctx.moveTo(w*0.05, y); ctx.lineTo(w*0.95, y); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, h*0.008); ctx.beginPath(); ctx.moveTo(w*0.18, h*0.76); ctx.quadraticCurveTo(w*0.5, h*0.42, w*0.82, h*0.76); ctx.stroke();
    for (let i = 1; i < 12; i++){ const t = i/12, x = w*0.18 + t*w*0.64, ay = h*0.76 - 4*t*(1-t)*(h*0.17); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ay); ctx.stroke(); }
    const tx = w*(0.32+r()*0.2); ctx.fillStyle = "#C93A2E"; ctx.fillRect(tx, y-h*0.05, w*0.14, h*0.045); ctx.fillStyle = "#FFE7A8";
    for (let i = 0; i < 5; i++) ctx.fillRect(tx + w*0.01 + i*w*0.026, y-h*0.04, w*0.012, h*0.014);
    for (let i = 0; i < 160; i++){ ctx.fillStyle = `rgba(255,255,255,${0.5+r()*0.5})`; ctx.beginPath(); ctx.arc(r()*w, r()*h, 0.6+r()*1.8, 0, 7); ctx.fill(); }
  },
  canal(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#0B1330"],[0.55,"#24305E"],[0.62,"#3A3F6E"]]); ctx.fillRect(0,0,w,h);
    for (let i = 0; i < 90; i++){ ctx.fillStyle = `rgba(255,255,255,${r()*0.8})`; ctx.fillRect(r()*w, r()*h*0.45, 1.2, 1.2); }
    const wy = h*0.62; let x = 0;
    while (x < w){ const bw = w*(0.12+r()*0.12), bh = h*(0.16+r()*0.12); ctx.fillStyle = r() > .5 ? "#3B2A2E" : "#2E2530"; ctx.fillRect(x, wy-bh, bw, bh);
      ctx.beginPath(); ctx.moveTo(x-2, wy-bh); ctx.lineTo(x+bw/2, wy-bh-h*0.05); ctx.lineTo(x+bw+2, wy-bh); ctx.fill();
      for (let k = 0; k < 3; k++){ const wx = x + bw*(0.2+k*0.25); glow(ctx, wx+bw*0.05, wy-bh*0.45, h*0.05, "rgba(255,190,110,.5)"); ctx.fillStyle = "#FFC57A"; ctx.fillRect(wx, wy-bh*0.55, bw*0.1, bh*0.2); }
      x += bw + 2; }
    ctx.fillStyle = lin(ctx, h, [[0.62,"#1E2850"],[1,"#0A1026"]]); ctx.fillRect(0, wy, w, h-wy);
    for (let i = 0; i < 7; i++){ const lx = w*(0.08+i*0.14); ctx.strokeStyle = "#1A1A22"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, wy+h*0.02); ctx.lineTo(lx, wy-h*0.1); ctx.stroke();
      glow(ctx, lx, wy-h*0.11, h*0.08, "rgba(255,200,120,.9)"); for (let k = 0; k < 14; k++){ ctx.fillStyle = `rgba(255,190,110,${0.5-k*0.03})`; ctx.fillRect(lx-3+Math.sin(k)*3, wy + h*0.02 + k*h*0.02, 6+r()*6, 2); } }
  },
  snowtown(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#1C2547"],[0.6,"#3E4D7A"],[1,"#6A75A0"]]); ctx.fillRect(0,0,w,h);
    ridge(ctx, w, h, h*0.45, h*0.12, s+9, "#E7ECF4");
    for (let i = 0; i < 6; i++){ const bx = i*w/6, bh = h*(0.25+r()*0.1); ctx.fillStyle = "#2A2A35"; ctx.fillRect(bx+4, h*0.75-bh, w/6-8, bh); ctx.fillStyle = "#F2F5FA"; ctx.fillRect(bx, h*0.75-bh-h*0.03, w/6, h*0.035); ctx.fillStyle = "#FFCB80"; for (let k = 0; k < 4; k++) ctx.fillRect(bx+10+k*(w/6-20)/4, h*0.75-bh*0.7, (w/6-20)/6, bh*0.2); }
    for (let i = 0; i < 6; i++) glow(ctx, w*(0.08+i*0.17), h*0.7, h*0.1, "rgba(255,200,130,.55)");
    ctx.fillStyle = "#EEF2F8"; ctx.fillRect(0, h*0.75, w, h*0.25);
    for (let i = 0; i < 140; i++){ ctx.fillStyle = `rgba(255,255,255,${0.4+r()*0.6})`; ctx.beginPath(); ctx.arc(r()*w, r()*h, 0.6+r()*1.6, 0, 7); ctx.fill(); }
  },
  sakura(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#9CC9EC"],[1,"#EAF4FB"]]); ctx.fillRect(0,0,w,h);
    ridge(ctx, w, h, h*0.55, h*0.1, s+11, "#9DB7A2");
    ctx.fillStyle = "#3B3330"; ctx.fillRect(0, h*0.6, w, h*0.04); ctx.fillStyle = "#4A403B"; ctx.fillRect(0, h*0.64, w, h*0.2);
    for (let i = 0; i < 26; i++) glow(ctx, r()*w, h*(0.3+r()*0.35), h*(0.08+r()*0.08), `rgba(246,${170+r()*40|0},${190+r()*30|0},.8)`);
    ctx.fillStyle = "#D9CFC2"; ctx.fillRect(0, h*0.84, w, h*0.16);
    for (let i = 0; i < 120; i++){ ctx.fillStyle = `rgba(250,190,205,${0.6+r()*0.4})`; ctx.beginPath(); ctx.ellipse(r()*w, r()*h, 2, 1.2, r()*3, 0, 7); ctx.fill(); }
  },
  // a tatami guest room whose window frames the destination's view
  room(ctx, w, h, s, view){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#EDE3D0"],[1,"#D9CBB0"]]); ctx.fillRect(0,0,w,h);
    const wx = w*0.2, wy = h*0.1, ww = w*0.6, wh = h*0.46;
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); ctx.translate(wx, wy); SCENES[view || "onsen"](ctx, ww, wh, s+7); ctx.restore();
    glow(ctx, w*0.5, h*0.62, h*0.55, "rgba(255,236,200,.35)");
    ctx.fillStyle = "#F7F2E6"; ctx.fillRect(wx - w*0.12, wy, w*0.14, wh); ctx.fillRect(wx + ww - w*0.02, wy, w*0.14, wh);
    ctx.strokeStyle = "rgba(120,90,60,.35)"; ctx.lineWidth = 1;
    for (const px of [wx - w*0.12, wx + ww - w*0.02]){ for (let k = 1; k < 4; k++){ ctx.beginPath(); ctx.moveTo(px + k*w*0.035, wy); ctx.lineTo(px + k*w*0.035, wy+wh); ctx.stroke(); } for (let k = 1; k < 6; k++){ ctx.beginPath(); ctx.moveTo(px, wy + k*wh/6); ctx.lineTo(px + w*0.14, wy + k*wh/6); ctx.stroke(); } }
    ctx.strokeStyle = "#5A3E2B"; ctx.lineWidth = Math.max(3, w*0.012); ctx.strokeRect(wx - w*0.12, wy, ww + w*0.24, wh);
    ctx.fillStyle = "#6B4A33"; ctx.fillRect(0, h*0.04, w, h*0.035);
    const fy = h*0.6; ctx.fillStyle = lin(ctx, h, [[0.6,"#C9BC7A"],[1,"#B3A562"]]); ctx.fillRect(0, fy, w, h-fy);
    ctx.strokeStyle = "rgba(70,60,20,.35)"; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++){ const yy = fy + (h-fy)*(k/4)**1.4; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
    for (let k = -4; k <= 4; k++){ ctx.beginPath(); ctx.moveTo(w/2 + k*w*0.06, fy); ctx.lineTo(w/2 + k*w*0.26, h); ctx.stroke(); }
    ctx.fillStyle = "#3D2618"; ctx.beginPath(); ctx.moveTo(w*0.3, h*0.74); ctx.lineTo(w*0.7, h*0.74); ctx.lineTo(w*0.78, h*0.86); ctx.lineTo(w*0.22, h*0.86); ctx.fill();
    ctx.fillStyle = "#2A190F"; ctx.fillRect(w*0.24, h*0.86, w*0.52, h*0.03);
    const zc = ["#2D4A7A","#9E3B32","#3C6B4E"][Math.floor(r()*3)]; ctx.fillStyle = zc;
    rr(ctx, w*0.08, h*0.82, w*0.16, h*0.1, 8); ctx.fill(); rr(ctx, w*0.76, h*0.82, w*0.16, h*0.1, 8); ctx.fill();
    ctx.fillStyle = "#F4EFE6"; ctx.beginPath(); ctx.ellipse(w*0.45, h*0.77, w*0.025, h*0.014, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(w*0.55, h*0.77, w*0.025, h*0.014, 0, 0, 7); ctx.fill();
  },
  // overhead shot of a kaiseki-style dinner tray
  dish(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#4A3426"],[1,"#2B1D14"]]); ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 30; i++){ ctx.beginPath(); const y = r()*h; ctx.moveTo(0, y); ctx.bezierCurveTo(w*0.3, y+8, w*0.6, y-8, w, y+4); ctx.stroke(); }
    ctx.fillStyle = "#141210"; rr(ctx, w*0.08, h*0.1, w*0.84, h*0.8, 18); ctx.fill(); ctx.strokeStyle = "#7A1F1A"; ctx.lineWidth = 6; ctx.stroke();
    const bowl = (x: number, y: number, rad: number, rim: string, fill: string, dots?: string) => { ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, rad*0.8, 0, 7); ctx.fill(); if (dots){ for (let i = 0; i < 40; i++){ ctx.fillStyle = dots; const a = r()*7, d = r()*rad*0.7; ctx.fillRect(x + Math.cos(a)*d, y + Math.sin(a)*d, 3, 2); } } glow(ctx, x - rad*0.3, y - rad*0.3, rad*0.6, "rgba(255,255,255,.18)"); };
    bowl(w*0.28, h*0.66, h*0.13, "#1F1F1F", "#F3EFE4", "#FFFFFF");
    bowl(w*0.5, h*0.68, h*0.11, "#8B2A1E", "#7A4A2A", "#C79A5E");
    ctx.fillStyle = "#EDEDE8"; ctx.beginPath(); ctx.ellipse(w*0.66, h*0.35, w*0.17, h*0.15, 0.1, 0, 7); ctx.fill();
    for (let i = 0; i < 5; i++){ ctx.fillStyle = i%2 ? "#E9785C" : "#C8323A"; ctx.save(); ctx.translate(w*(0.56+i*0.045), h*0.35); ctx.rotate(0.5); rr(ctx, -w*0.025, -h*0.07, w*0.05, h*0.14, 6); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#4E8A3A"; ctx.beginPath(); ctx.ellipse(w*0.75, h*0.42, w*0.03, h*0.02, 0.6, 0, 7); ctx.fill();
    bowl(w*0.3, h*0.32, h*0.1, "#2E2E2E", "#D9B14A", "#F2D27A");
    bowl(w*0.78, h*0.7, h*0.09, "#F0EEE8", "#5C7F3E", "#A6C37A");
    ctx.strokeStyle = "#C9A27A"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(w*0.14, h*0.86); ctx.lineTo(w*0.62, h*0.84); ctx.moveTo(w*0.14, h*0.88); ctx.lineTo(w*0.62, h*0.875); ctx.stroke();
    for (let k = 0; k < 6; k++) glow(ctx, w*0.5 + Math.sin(k)*10, h*0.55 - k*h*0.06, h*(0.05+k*0.02), `rgba(255,255,255,${0.12-k*0.015})`);
  },
  // crafts and souvenirs arranged on a table
  craft(ctx, w, h, s){ const r = rng(s);
    ctx.fillStyle = lin(ctx, h, [[0,"#F1ECE3"],[1,"#DCD3C4"]]); ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "rgba(0,0,0,.05)"; for (let i = 0; i < 300; i++) ctx.fillRect(r()*w, r()*h, 1, 1);
    const pal = [["#9E2B24","#1E1B1A"],["#2D5C8A","#BFD9EE"],["#C79A3A","#3A2A1E"],["#3C6B4E","#E8E2D2"]][Math.floor(r()*4)];
    const items = 5;
    for (let i = 0; i < items; i++){
      const x = w*(0.18 + (i%3)*0.32) + (r()-0.5)*w*0.06, y = h*(0.35 + Math.floor(i/3)*0.36) + (r()-0.5)*h*0.06, rad = h*(0.1+r()*0.06);
      ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.beginPath(); ctx.ellipse(x+rad*0.15, y+rad*0.25, rad, rad*0.9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = pal[i%2][0]; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
      ctx.fillStyle = pal[i%2][1]; ctx.beginPath(); ctx.arc(x, y, rad*0.72, 0, 7); ctx.fill();
      glow(ctx, x - rad*0.35, y - rad*0.4, rad*0.5, "rgba(255,255,255,.45)");
    }
    ctx.fillStyle = "#B88A57"; for (let k = 0; k < 2; k++){ ctx.save(); ctx.translate(w*0.7, h*0.85 + k*10); ctx.rotate(-0.15); ctx.fillRect(-w*0.25, 0, w*0.5, 6); ctx.restore(); }
  },
  // ryokan exterior at dusk with lanterns and a noren curtain
  exterior(ctx, w, h, s, view){ const r = rng(s);
    const night = view === "canal" || view === "snowtown";
    ctx.fillStyle = lin(ctx, h, night ? [[0,"#0F1836"],[1,"#3B4677"]] : [[0,"#3B4B7A"],[0.6,"#D58A73"],[1,"#F2C38D"]]); ctx.fillRect(0,0,w,h);
    ridge(ctx, w, h, h*0.42, h*0.1, s+2, night ? "#2A3358" : "#6B5674");
    const bx = w*0.12, bw = w*0.76, by = h*0.36;
    ctx.fillStyle = "#2B2420"; ctx.beginPath(); ctx.moveTo(bx - w*0.06, by); ctx.lineTo(bx + bw + w*0.06, by); ctx.lineTo(bx + bw - w*0.04, by - h*0.12); ctx.lineTo(bx + w*0.04, by - h*0.12); ctx.fill();
    ctx.fillStyle = "#4A3A30"; ctx.fillRect(bx, by, bw, h*0.24);
    ctx.fillStyle = "#2B2420"; ctx.beginPath(); ctx.moveTo(bx - w*0.06, by + h*0.24); ctx.lineTo(bx + bw + w*0.06, by + h*0.24); ctx.lineTo(bx + bw, by + h*0.18); ctx.lineTo(bx, by + h*0.18); ctx.fill();
    for (let i = 0; i < 6; i++){ ctx.fillStyle = "#FFCB7E"; ctx.fillRect(bx + w*0.03 + i*bw/6, by + h*0.04, bw/6 - w*0.04, h*0.1); }
    ctx.fillStyle = "#3D2E26"; ctx.fillRect(bx, by + h*0.24, bw, h*0.22);
    glow(ctx, w*0.5, by + h*0.36, h*0.25, "rgba(255,200,130,.6)");
    ctx.fillStyle = "#FFE0A8"; ctx.fillRect(w*0.4, by + h*0.28, w*0.2, h*0.18);
    ctx.fillStyle = "#1F3A66"; ctx.fillRect(w*0.4, by + h*0.28, w*0.2, h*0.07); ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(w*0.468, by + h*0.29, w*0.004, h*0.05); ctx.fillRect(w*0.532, by + h*0.29, w*0.004, h*0.05);
    for (const lx of [w*0.32, w*0.68]){ glow(ctx, lx, by + h*0.33, h*0.09, "rgba(255,170,90,.9)"); ctx.fillStyle = "#F4A25C"; rr(ctx, lx - w*0.025, by + h*0.3, w*0.05, h*0.07, 10); ctx.fill(); }
    ctx.fillStyle = night && view === "snowtown" ? "#EEF2F8" : "#8E8A82"; ctx.fillRect(0, h*0.82, w, h*0.18);
    if (view === "snowtown" || view === "snow"){ ctx.fillStyle = "#F2F5FA"; ctx.fillRect(bx - w*0.06, by - h*0.125, bw + w*0.12, h*0.02); for (let i = 0; i < 120; i++){ ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(r()*w, r()*h, 1+r()*1.5, 0, 7); ctx.fill(); } }
    if (view === "onsen") for (let k = 0; k < 6; k++) glow(ctx, w*(0.2+r()*0.6), h*(0.2 - k*0.02), h*0.12, "rgba(255,255,255,.15)");
  },
};

export function drawScene(ctx: Ctx, w: number, h: number, scene: SceneName, seed: number, view?: SceneName) {
  SCENES[scene](ctx, w, h, seed, view);
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,.26)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}
