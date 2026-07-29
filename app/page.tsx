"use client";

import { useEffect, useRef, useState } from "react";

type Status = "ready" | "playing" | "won" | "lost";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef({ left: false, right: false, jump: false });
  const [status, setStatus] = useState<Status>("ready");
  const [coins, setCoins] = useState(0);
  const [big, setBig] = useState(false);
  const restartRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 960;
    const H = 540;
    const worldW = 3400;
    const groundY = 455;
    let animation = 0;
    let gameStatus: Status = "ready";
    let camera = 0;
    let collected = new Set<number>();
    let mushroomTaken = false;
    let startTime = performance.now();
    const player = { x: 100, y: groundY - 46, w: 34, h: 46, vx: 0, vy: 0, grounded: false, big: false };
    const platforms = [
      { x: 0, y: groundY, w: 720, h: 100 }, { x: 800, y: groundY, w: 560, h: 100 },
      { x: 1440, y: groundY, w: 380, h: 100 }, { x: 1900, y: groundY, w: 620, h: 100 },
      { x: 2600, y: groundY, w: 800, h: 100 }, { x: 410, y: 340, w: 180, h: 28 },
      { x: 980, y: 315, w: 170, h: 28 }, { x: 1550, y: 330, w: 150, h: 28 },
      { x: 2110, y: 285, w: 200, h: 28 },
    ];
    const coinPositions = [
      [260, 375], [340, 375], [450, 285], [530, 285], [900, 375], [1030, 255],
      [1110, 255], [1515, 375], [1600, 275], [1980, 375], [2170, 225], [2260, 225],
      [2410, 375], [2700, 375], [2810, 375],
    ];
    const enemies = [
      { x: 610, y: 419, min: 570, max: 690, dir: 1, alive: true },
      { x: 1240, y: 419, min: 1170, max: 1330, dir: -1, alive: true },
      { x: 1760, y: 419, min: 1700, max: 1800, dir: 1, alive: true },
      { x: 2380, y: 419, min: 2320, max: 2480, dir: -1, alive: true },
    ];

    const reset = () => {
      player.x = 100; player.y = groundY - 46; player.vx = 0; player.vy = 0;
      player.w = 34; player.h = 46; player.big = false; collected = new Set();
      mushroomTaken = false; camera = 0; gameStatus = "playing"; startTime = performance.now();
      enemies.forEach((e) => e.alive = true);
      setCoins(0); setBig(false); setStatus("playing");
    };
    restartRef.current = reset;

    const overlap = (a: {x:number;y:number;w:number;h:number}, b: {x:number;y:number;w:number;h:number}) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    const drawPixelCloud = (x: number, y: number, s = 1) => {
      ctx.fillStyle = "#fff4cf";
      ctx.fillRect(x, y + 18*s, 100*s, 26*s); ctx.fillRect(x + 18*s, y, 45*s, 35*s);
      ctx.fillRect(x + 58*s, y + 9*s, 28*s, 28*s);
    };
    const drawBlock = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = "#6f3b2b"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#a95b37"; ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = "#55b953"; ctx.fillRect(x, y - 9, w, 11);
      ctx.fillStyle = "#91df64"; ctx.fillRect(x, y - 9, w, 5);
      ctx.strokeStyle = "#4a2730"; ctx.lineWidth = 3;
      for (let bx = x; bx < x + w; bx += 42) ctx.strokeRect(bx, y + 12, 42, 28);
    };
    const drawPalace = (x: number) => {
      ctx.fillStyle = "#b7332b"; ctx.fillRect(x + 35, 290, 270, 165);
      ctx.fillStyle = "#f1c45e"; ctx.fillRect(x + 55, 315, 230, 16);
      ctx.fillStyle = "#1f6072"; ctx.fillRect(x + 65, 335, 210, 16);
      ctx.fillStyle = "#ef9f2f";
      ctx.beginPath(); ctx.moveTo(x, 290); ctx.lineTo(x + 45, 250); ctx.lineTo(x + 295, 250); ctx.lineTo(x + 340, 290); ctx.fill();
      ctx.fillStyle = "#ffd65c"; ctx.fillRect(x + 28, 280, 284, 13);
      ctx.fillStyle = "#ef9f2f";
      ctx.beginPath(); ctx.moveTo(x + 38, 250); ctx.lineTo(x + 78, 205); ctx.lineTo(x + 262, 205); ctx.lineTo(x + 302, 250); ctx.fill();
      ctx.fillStyle = "#ffd65c"; ctx.fillRect(x + 67, 240, 206, 12);
      ctx.fillStyle = "#6f201f"; ctx.fillRect(x + 135, 365, 70, 90);
      ctx.fillStyle = "#e9be75";
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 55 + i*47, 315, 12, 140);
      ctx.fillStyle = "#203e54"; ctx.fillRect(x + 120, 262, 100, 34);
      ctx.fillStyle = "#ffd65c"; ctx.font = "900 22px serif"; ctx.textAlign = "center"; ctx.fillText("皇 宫", x + 170, 287);
      ctx.fillStyle = "#ef9f2f";
      ctx.fillRect(x + 15, 275, 28, 10); ctx.fillRect(x + 297, 275, 28, 10);
    };
    const drawPlayer = () => {
      const x = Math.round(player.x - camera), y = Math.round(player.y);
      ctx.save();
      ctx.fillStyle = "#171d2d"; ctx.fillRect(x + 9, y - 8, player.w - 18, 10);
      ctx.fillRect(x + 5, y - 3, player.w - 10, 9);
      ctx.fillStyle = "#f2b279"; ctx.fillRect(x + 6, y + 7, player.w - 12, 15);
      ctx.fillStyle = "#171d2d"; ctx.fillRect(x + 3, y + 5, 7, 18); ctx.fillRect(x + player.w - 10, y + 5, 7, 18);
      ctx.fillRect(x + 11, y + 10, 4, 5); ctx.fillRect(x + player.w - 15, y + 10, 4, 5);
      ctx.fillStyle = "#1d2837"; ctx.fillRect(x + 2, y + 23, player.w - 4, player.h - 23);
      ctx.fillStyle = "#d8a843"; ctx.fillRect(x + 5, y + 27, 4, player.h - 30); ctx.fillRect(x + player.w - 9, y + 27, 4, player.h - 30);
      ctx.fillRect(x + 6, y + 31, player.w - 12, 4);
      ctx.fillStyle = "#6d3529"; ctx.fillRect(x, y + player.h - 7, 13, 7); ctx.fillRect(x + player.w - 13, y + player.h - 7, 13, 7);
      ctx.restore();
    };

    const update = () => {
      if (gameStatus !== "playing") return;
      const c = controls.current;
      player.vx += (c.left ? -0.7 : 0) + (c.right ? 0.7 : 0);
      player.vx *= 0.82; player.vx = Math.max(-6, Math.min(6, player.vx));
      if (c.jump && player.grounded) { player.vy = -13.5; player.grounded = false; }
      player.vy += 0.68; player.vy = Math.min(player.vy, 15);
      player.x += player.vx; player.x = Math.max(0, Math.min(worldW - player.w, player.x));
      const oldBottom = player.y + player.h;
      player.y += player.vy; player.grounded = false;
      for (const p of platforms) {
        if (player.x + player.w > p.x && player.x < p.x + p.w && oldBottom <= p.y + 2 && player.y + player.h >= p.y && player.vy >= 0) {
          player.y = p.y - player.h; player.vy = 0; player.grounded = true;
        }
      }
      coinPositions.forEach(([x, y], i) => {
        if (!collected.has(i) && overlap(player, { x: x - 13, y: y - 13, w: 26, h: 26 })) {
          collected.add(i); setCoins(collected.size);
        }
      });
      if (!mushroomTaken && overlap(player, { x: 1280, y: 375, w: 38, h: 38 })) {
        mushroomTaken = true; player.big = true; player.y -= 34; player.h = 80; player.w = 46;
        setBig(true);
      }
      enemies.forEach((e) => {
        if (!e.alive) return;
        e.x += e.dir * 1.3; if (e.x <= e.min || e.x >= e.max) e.dir *= -1;
        const box = { x: e.x, y: e.y, w: 38, h: 36 };
        if (overlap(player, box)) {
          if (player.vy > 2 && player.y + player.h - 14 < e.y) { e.alive = false; player.vy = -8; }
          else if (player.big) { player.big = false; player.h = 46; player.w = 34; setBig(false); player.vy = -8; }
          else { gameStatus = "lost"; setStatus("lost"); }
        }
      });
      if (player.y > H + 100) { gameStatus = "lost"; setStatus("lost"); }
      if (player.x > 3180) { gameStatus = "won"; setStatus("won"); }
      camera += ((player.x - W * 0.35) - camera) * 0.09;
      camera = Math.max(0, Math.min(worldW - W, camera));
    };

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#55c9c5"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#8edbd0";
      for (let i = 0; i < 7; i++) {
        const hx = ((i * 260 - camera * 0.18) % 1900) - 120;
        ctx.beginPath(); ctx.arc(hx, 455, 170, Math.PI, 0); ctx.fill();
      }
      drawPixelCloud(130 - camera * .12, 70, 1.1); drawPixelCloud(570 - camera * .09, 120, .8);
      drawPixelCloud(1030 - camera * .12, 55, 1.25); drawPixelCloud(1600 - camera * .1, 100, .9);
      ctx.save(); ctx.translate(-camera, 0);
      platforms.forEach((p) => drawBlock(p.x, p.y, p.w, p.h));
      coinPositions.forEach(([x, y], i) => {
        if (collected.has(i)) return;
        ctx.fillStyle = "#ffdc45"; ctx.fillRect(x - 8, y - 13, 16, 26);
        ctx.fillStyle = "#fff09a"; ctx.fillRect(x - 3, y - 9, 5, 16);
        ctx.strokeStyle = "#c9832d"; ctx.lineWidth = 3; ctx.strokeRect(x - 8, y - 13, 16, 26);
      });
      if (!mushroomTaken) {
        ctx.strokeStyle = "#7a3e23"; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(1299, 372); ctx.lineTo(1299, 423); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = "#df3429"; ctx.beginPath(); ctx.arc(1299, 382 + i * 10, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#ff7d42"; ctx.fillRect(1295, 377 + i * 10, 4, 4);
        }
      }
      enemies.forEach((e) => {
        if (!e.alive) return;
        ctx.fillStyle = "#824a8e"; ctx.fillRect(e.x, e.y + 12, 38, 24);
        ctx.fillStyle = "#a866b4"; ctx.fillRect(e.x + 6, e.y + 5, 26, 22);
        ctx.fillStyle = "#fff2c5"; ctx.fillRect(e.x + 9, e.y + 12, 6, 7); ctx.fillRect(e.x + 25, e.y + 12, 6, 7);
        ctx.fillStyle = "#2b2448"; ctx.fillRect(e.x + 11, e.y + 14, 3, 4); ctx.fillRect(e.x + 27, e.y + 14, 3, 4);
      });
      drawPalace(3045);
      ctx.restore();
      drawPlayer();
      if (gameStatus === "ready") {
        ctx.fillStyle = "rgba(28,26,47,.5)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff4cf"; ctx.font = "900 42px monospace"; ctx.textAlign = "center";
        ctx.fillText("准备好了吗？", W/2, 230);
      }
      animation = requestAnimationFrame(loop);
    };
    const loop = () => { update(); draw(); };
    loop();

    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight","ArrowUp"," ","a","d","w","A","D","W"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") controls.current.left = down;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") controls.current.right = down;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" || e.key === " ") controls.current.jump = down;
      if (down && e.key.toLowerCase() === "r") reset();
    };
    const down = key(true), up = key(false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { cancelAnimationFrame(animation); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const press = (name: "left" | "right" | "jump", value: boolean) => () => { controls.current[name] = value; };

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brandDot">P</span><span>PIXEL QUEST</span></div>
        <div className="fixedHero">固定角色 · 少年侠客</div>
      </header>

      <section className="hero">
        <div className="eyebrow">一关 · 一串糖葫芦 · 一座皇宫</div>
        <h1>出发吧，少年侠客！</h1>
        <p>越过山谷，踩扁捣蛋怪，吃下糖葫芦获得大力状态，一路闯到金瓦皇宫。</p>
      </section>

      <section className="gameShell">
        <div className="hud">
          <div><span className="hudLabel">关卡</span><strong>1 — 皇城郊野</strong></div>
          <div className="hudStats"><span>🟡 × {String(coins).padStart(2,"0")}</span><span>{big ? "🍡 大力状态" : "♡ 轻功状态"}</span></div>
        </div>
        <div className="canvasWrap">
          <canvas ref={canvasRef} width="960" height="540" aria-label="横版平台游戏画面" />
          {status !== "playing" && (
            <div className="gameOverlay">
              {status === "ready" && <><span className="overlayMini">侠客的旅程正在等待</span><h2>抵达右边的皇宫</h2><p>← → 移动　·　空格跳跃　·　R 重来</p></>}
              {status === "won" && <><span className="trophy">♛</span><h2>皇宫到了！</h2><p>你收集了 {coins} 枚金币，完成了皇城郊野。</p></>}
              {status === "lost" && <><span className="trophy">☁</span><h2>差一点！</h2><p>冒险家不会被一个小坑打败。</p></>}
              <button onClick={() => restartRef.current()}>{status === "ready" ? "开始冒险 →" : "再玩一次 ↻"}</button>
            </div>
          )}
        </div>
        <div className="mobileControls">
          <button aria-label="向左" onPointerDown={press("left", true)} onPointerUp={press("left", false)} onPointerLeave={press("left", false)}>←</button>
          <button aria-label="向右" onPointerDown={press("right", true)} onPointerUp={press("right", false)} onPointerLeave={press("right", false)}>→</button>
          <button className="jumpButton" aria-label="跳跃" onPointerDown={press("jump", true)} onPointerUp={press("jump", false)} onPointerLeave={press("jump", false)}>跳</button>
        </div>
      </section>

      <section className="tips">
        <article><span>01</span><div><h3>固定少年侠客</h3><p>身穿玄色金纹劲装，轻功跳跃，踏上唯一的皇城之路。</p></div></article>
        <article><span>02</span><div><h3>糖葫芦大力状态</h3><p>碰到闪亮糖葫芦，体型和抗打能力都会提升。</p></div></article>
        <article><span>03</span><div><h3>目标：金瓦皇宫</h3><p>一路向右，安全穿过皇城郊野就是胜利。</p></div></article>
      </section>
      <footer><span>PIXEL QUEST</span><span>原创像素冒险 · 为你而造</span></footer>
    </main>
  );
}
