(() => {
  if (window.__V13_IPAD_FIX__) return;
  window.__V13_IPAD_FIX__ = true;

  const style = document.createElement('style');
  style.id = 'v13-ipad-fix-style';
  style.textContent = `
    .targetCursor .wand{display:none;position:absolute;left:50%;top:18px;width:5px;height:58px;transform:translateX(-50%);border-radius:999px;background:#f8fafc;border:1px solid rgba(15,23,42,.85);box-shadow:0 1px 4px rgba(0,0,0,.35)}
    .targetCursor .wand::after{content:'';position:absolute;left:50%;bottom:-14px;width:18px;height:18px;transform:translateX(-50%);border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.9),0 2px 5px rgba(0,0,0,.4)}
    .targetCursor.touchWand{width:30px;height:30px;border-width:2px}
    .targetCursor.touchWand .dot{width:7px;height:7px;background:#0ea5e9;border:2px solid #fff;box-shadow:0 0 0 1px #111}
    .targetCursor.touchWand .wand{display:block}
  `;
  document.head.appendChild(style);

  if (typeof targetCursor !== 'undefined' && targetCursor && !targetCursor.querySelector('.wand')) {
    const wand = document.createElement('span');
    wand.className = 'wand';
    targetCursor.appendChild(wand);
  }

  const v13IsTouchDevice = () =>
    (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia('(pointer:coarse)').matches ||
    window.matchMedia('(hover:none)').matches;

  const v13IsFingerEvent = ev =>
    !!ev && (ev.pointerType === 'touch' || (!ev.pointerType && v13IsTouchDevice()));

  const TOUCH_AIM_OFFSET = 82;

  const v13TargetClientPoint = ev => {
    let x = ev.clientX, y = ev.clientY, touchWand = false;
    if ((mode === 'calibrate' || mode === 'measure') && v13IsFingerEvent(ev)) {
      const r = canvas.getBoundingClientRect();
      y = Math.max(r.top + 20, ev.clientY - TOUCH_AIM_OFFSET);
      touchWand = true;
    }
    return {x, y, touchWand};
  };

  if (typeof toCanvasPos === 'function') {
    const originalToCanvasPos = toCanvasPos;
    toCanvasPos = function(ev) {
      if ((mode === 'calibrate' || mode === 'measure') && v13IsFingerEvent(ev)) {
        const r = canvas.getBoundingClientRect();
        const t = v13TargetClientPoint(ev);
        return {
          x: (t.x - r.left) * (canvas.width / r.width),
          y: (t.y - r.top) * (canvas.height / r.height)
        };
      }
      return originalToCanvasPos(ev);
    };
  }

  if (typeof showTargetCursor === 'function') {
    showTargetCursor = function(ev) {
      if (mode !== 'calibrate' && mode !== 'measure') {
        targetCursor.style.display = 'none';
        targetCursor.classList.remove('touchWand');
        return;
      }
      const r = canvas.getBoundingClientRect();
      const t = v13TargetClientPoint(ev);
      const fingerInside = ev.clientX >= r.left && ev.clientX <= r.right &&
                           ev.clientY >= r.top && ev.clientY <= r.bottom;
      const targetInside = t.x >= r.left && t.x <= r.right &&
                           t.y >= r.top && t.y <= r.bottom;
      if (!fingerInside || !targetInside) {
        targetCursor.style.display = 'none';
        return;
      }
      targetCursor.classList.toggle('touchWand', t.touchWand);
      targetCursor.style.display = 'block';
      targetCursor.style.left = t.x + 'px';
      targetCursor.style.top = t.y + 'px';
    };
  }

  if (typeof canvas !== 'undefined' && canvas) {
    canvas.addEventListener('pointerdown', ev => {
      if (mode === 'calibrate' || mode === 'measure') showTargetCursor(ev);
    }, true);
  }

  const measureBtn = document.getElementById('measureBtn');
  if (measureBtn && typeof measureBtn.onclick === 'function') {
    const oldMeasureClick = measureBtn.onclick;
    measureBtn.onclick = function(ev) {
      if (typeof measurements !== 'undefined' && Array.isArray(measurements)) {
        measurements.forEach(m => m.pinned = true);
      }
      oldMeasureClick.call(this, ev);
      if (mode === 'measure' && v13IsTouchDevice() && typeof setStatus === 'function') {
        setStatus('القياس: ضع إصبعك على الخارطة، والنقطة في رأس العصا هي نقطة القياس الدقيقة');
      }
      if (typeof draw === 'function') draw();
    };
  }

  const calibrateBtn = document.getElementById('calibrateBtn');
  if (calibrateBtn && typeof calibrateBtn.onclick === 'function') {
    const oldCalibrateClick = calibrateBtn.onclick;
    calibrateBtn.onclick = function(ev) {
      oldCalibrateClick.call(this, ev);
      if (mode === 'calibrate' && v13IsTouchDevice() && typeof setStatus === 'function') {
        setStatus('المعايرة: رأس العصا هو نقطة التحديد — إصبعك يبقى بعيداً عنها');
      }
    };
  }

  if (typeof drawMeasurements === 'function') {
    drawMeasurements = function() {
      if (!pxPerCm) return;
      const u = 1 / zoom;
      const touchBoost = v13IsTouchDevice() ? 2 : 1;
      ctx.save();

      for (const m of measurements) {
        const selected = m.id === selectedMeasureId;
        const disp = measurementDisplay(m);
        const q1 = disp.q1, q2 = disp.q2;
        const base = m.pinned ? '#111111' : '#4b5563';

        if ((m.offsetX || 0) !== 0 || (m.offsetY || 0) !== 0) {
          ctx.strokeStyle = 'rgba(17,17,17,.34)';
          ctx.lineWidth = .75 * u;
          ctx.setLineDash([2 * u, 3 * u]);
          ctx.beginPath(); ctx.moveTo(m.p1.x, m.p1.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(m.p2.x, m.p2.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = selected ? '#000' : base;
        ctx.fillStyle = selected ? '#000' : base;
        ctx.lineWidth = (selected ? 1.6 : 1.2) * u;
        ctx.setLineDash(m.pinned ? [] : [4 * u, 4 * u]);

        const ang = Math.atan2(q2.y - q1.y, q2.x - q1.x);
        ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
        ctx.setLineDash([]);

        const arrowSize = 6.2 * u * (v13IsTouchDevice() ? 1.35 : 1);
        drawArrowHead(q1.x, q1.y, ang + Math.PI, arrowSize);
        drawArrowHead(q2.x, q2.y, ang, arrowSize);

        const mx = (q1.x + q2.x) / 2, my = (q1.y + q2.y) / 2;
        const label = formatLength(m.cm);
        ctx.font = `bold ${11.5 * touchBoost * u}px Tahoma`;
        const tw = ctx.measureText(label).width;
        const lh = 19 * touchBoost * u, pad = 5.5 * touchBoost * u;
        const bx = mx - tw / 2 - pad, by = my - lh / 2, bw = tw + pad * 2, bh = lh;

        ctx.fillStyle = 'rgba(255,255,255,.90)';
        roundRectPath(bx, by, bw, bh, 5 * u); ctx.fill();
        if (selected) {
          ctx.strokeStyle = 'rgba(0,0,0,.55)';
          ctx.lineWidth = .8 * u;
          ctx.stroke();
        }

        ctx.fillStyle = '#111';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my + .2 * u);

        const xs = 11 * u * (v13IsTouchDevice() ? 1.55 : 1);
        const xx = bx + bw + 3 * u, xy = my - xs / 2;
        ctx.fillStyle = 'rgba(255,255,255,.96)';
        ctx.strokeStyle = 'rgba(0,0,0,.55)';
        ctx.lineWidth = .7 * u;
        ctx.beginPath();
        ctx.arc(xx + xs / 2, xy + xs / 2, xs / 2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#111';
        ctx.font = `${9 * u * (v13IsTouchDevice() ? 1.45 : 1)}px Arial`;
        ctx.fillText('×', xx + xs / 2, xy + xs / 2 + .3 * u);

        m._labelBox = {x: bx - 2 * u, y: by - 2 * u, w: bw + 4 * u, h: bh + 4 * u};
        m._deleteBox = {x: xx - 2 * u, y: xy - 2 * u, w: xs + 4 * u, h: xs + 4 * u};
      }

      ctx.restore();
    };
  }

  if (typeof draw === 'function') draw();
})();