/* VangIoT 动态背景 —— 复刻 experthub.tencent.com 的 Canvas 2D 效果（浅色主题适配版）
 * 分层：星云光斑(径向渐变) + 闪烁星空 + 漂浮节点(距离连线+鼠标牵引) + 水平数据脉冲
 * 纯原生 Canvas 2D + requestAnimationFrame，无第三方库 */
(function () {
  const c = document.getElementById('bgCanvas');
  if (!c) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // 尊重系统减少动态偏好
  const x = c.getContext('2d');
  let W, H, DPR = Math.min(devicePixelRatio || 1, 2);
  const stars = [], nodes = [], pk = [];
  const PAL = [[47, 109, 246], [16, 161, 115], [217, 138, 38], [110, 160, 255]];
  const m = { x: -9999, y: -9999 };

  function size() {
    W = innerWidth; H = innerHeight;
    c.width = W * DPR; c.height = H * DPR;
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }
  function build() {
    stars.length = 0; nodes.length = 0; pk.length = 0;
    // 星空：按面积撒点，每颗带相位与闪烁速度
    const n = Math.round(W * H / 9000);
    for (let i = 0; i < n; i++) stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + .3, a: Math.random() * .22 + .05,
      s: Math.random() * .02 + .004, p: Math.random() * 6.28
    });
    // 漂浮节点（星座网）
    const nn = Math.min(46, Math.round(W / 34));
    for (let i = 0; i < nn; i++) nodes.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.6 + .8
    });
    // 数据脉冲：沿水平轨道飞行的光点
    for (let i = 0; i < 8; i++) pk.push({
      y: Math.random() * H, x: Math.random() * W,
      v: .6 + Math.random() * 1.8, len: 40 + Math.random() * 80, c: Math.random()
    });
  }
  addEventListener('resize', size);
  addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', () => { m.x = -9999; m.y = -9999; });

  function blob(cx, cy, r, col, alpha) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(' + col + ',' + alpha + ')');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  function draw(t) {
    x.clearRect(0, 0, W, H);
    /* 星云团：蓝 / 绿 / 琥珀，缓慢摆动 */
    blob(W * .5 + Math.sin(t * .00005) * W * .06, H * .3, Math.max(W, H) * .42, '47,109,246', .05);
    blob(W * .18, H * .66 + Math.cos(t * .00004) * H * .05, Math.max(W, H) * .3, '16,161,115', .04);
    blob(W * .85, H * .8, Math.max(W, H) * .26, '217,138,38', .03);
    /* 星空闪烁 */
    for (const s of stars) {
      const a = s.a * (.55 + .45 * Math.sin(t * s.s + s.p));
      x.fillStyle = 'rgba(135,145,167,' + a.toFixed(3) + ')';
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill();
    }
    /* 节点漂移 + 边界反弹 */
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }
    /* 距离阈值连线（星座网） */
    x.lineWidth = 1;
    const LINK = 130;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          x.strokeStyle = 'rgba(135,145,167,' + ((1 - Math.sqrt(d2) / LINK) * .16).toFixed(3) + ')';
          x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
        }
      }
      /* 鼠标牵引：节点与光标连线 */
      const mdx = a.x - m.x, mdy = a.y - m.y, md2 = mdx * mdx + mdy * mdy, ML = 180;
      if (md2 < ML * ML) {
        x.strokeStyle = 'rgba(47,109,246,' + ((1 - Math.sqrt(md2) / ML) * .3).toFixed(3) + ')';
        x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(m.x, m.y); x.stroke();
      }
      x.fillStyle = 'rgba(91,101,128,.3)';
      x.beginPath(); x.arc(a.x, a.y, a.r, 0, 6.283); x.fill();
    }
    /* 数据脉冲：带渐隐拖尾的水平光点 */
    for (const p of pk) {
      p.x += p.v;
      if (p.x - p.len > W) { p.x = -p.len; p.y = Math.random() * H; }
      const col = PAL[(p.c * PAL.length) | 0];
      const g = x.createLinearGradient(p.x - p.len, 0, p.x, 0);
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(1, 'rgba(' + col + ',.45)');
      x.strokeStyle = g; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(p.x - p.len, p.y); x.lineTo(p.x, p.y); x.stroke();
      x.fillStyle = 'rgba(' + col + ',.75)';
      x.beginPath(); x.arc(p.x, p.y, 1.6, 0, 6.283); x.fill();
    }
  }

  /* rAF 主循环：累计时间驱动，页面隐藏时暂停省电 */
  let running = false, raf = 0, last = 0, acc = 0;
  function tick(ts) {
    if (!last) last = ts;
    acc += ts - last; last = ts;
    draw(acc);
    raf = running ? requestAnimationFrame(tick) : 0;
  }
  function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(tick); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  size(); start();
})();
