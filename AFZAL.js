(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  /* ---------- Gear drawing ---------- */
  function gearD(R, r, n) {
    var d = "", i, a, w = Math.PI / n, t = w * 0.34, b = w * 0.62;
    for (i = 0; i < n; i++) {
      a = i * 2 * w;
      [[a - b, r], [a - t, R], [a + t, R], [a + b, r]].forEach(function (q, k) {
        d += (i === 0 && k === 0 ? "M" : "L") + (Math.cos(q[0]) * q[1]).toFixed(1) + " " + (Math.sin(q[0]) * q[1]).toFixed(1);
      });
      var na = a + 2 * w - b;
      d += "A" + r + " " + r + " 0 0 1 " + (Math.cos(na) * r).toFixed(1) + " " + (Math.sin(na) * r).toFixed(1);
    }
    return d + "Z";
  }

  function gearInner(R, r, n, hub) {
    var s = '<path d="' + gearD(R, r, n) + '"/><circle r="' + hub + '"/><circle r="' + (hub * 0.3) + '"/>';
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + 0.4;
      s += '<path d="M' + (Math.cos(a) * hub).toFixed(1) + " " + (Math.sin(a) * hub).toFixed(1) + "L" + (Math.cos(a) * r * 0.85).toFixed(1) + " " + (Math.sin(a) * r * 0.85).toFixed(1) + '"/>';
    }
    return s;
  }

  [].slice.call(document.querySelectorAll("svg.gear")).forEach(function (svg) {
    var n = parseInt(svg.getAttribute("data-teeth"), 10) || 14;
    svg.innerHTML = '<g class="spin">' + gearInner(96, 82, n, 30) + "</g>";
  });

  /* ---------- Certificates ---------- */
  var certs = [
    ["Battery Pack Modeling", "02 May 2026", "certificate-1.png", "MathWorks Training Services"],
    ["Signal Processing Onramp", "26 August 2025", "certificate-2.png", "MathWorks Training Services"],
    ["Circuit Simulation Onramp", "02 May 2026", "certificate-3.png", "MathWorks Training Services"],
    ["Power Electronics Simulation Onramp", "02 May 2026", "certificate-4.png", "MathWorks Training Services"],
    ["Simscape Battery Onramp", "02 May 2026", "certificate-5.png", "MathWorks Training Services"],
    ["Simscape Onramp", "01 May 2026", "certificate-6.png", "MathWorks Training Services"],
    ["FDP on PLC, HMI & Industrial Automation Technologies", "", "certificate-7.png", "BNMIT",
      "Certificate for the 7-day FDP on PLC, HMI & Industrial Automation Technologies at BNMIT."]
  ];

  document.getElementById("archive").innerHTML = certs.map(function (c, i) {
    var desc = c[4] || "Completed 100% of the self-paced MathWorks training course " + c[0] + ".";
    return '<div class="story"><div class="stage">' +
      '<figure class="frame glass"><img src="./png%20certificate/' + c[2] + '" alt="Certificate: ' + c[0] + '"></figure>' +
      '<div class="ctext">' +
      '<p class="mono">Certificate ' + (i + 1) + " of " + certs.length + "</p>" +
      "<h3>" + c[0] + "</h3>" +
      '<p class="c-c">' + c[3] + "</p>" +
      (c[1] ? '<p class="c-d">' + c[1] + "</p>" : "") +
      "<p>" + desc + "</p>" +
      "</div></div></div>";
  }).join("");

  /* ---------- Elements ---------- */
  var layers = [].slice.call(document.querySelectorAll("[data-speed]"));
  var stories = [].slice.call(document.querySelectorAll(".story"));
  var process = document.getElementById("process");
  var steps = [].slice.call(document.querySelectorAll(".pstep"));
  var termLines = [].slice.call(document.querySelectorAll(".term li"));
  var cursor = document.querySelector(".cursor");
  var vh = window.innerHeight;
  var mouseX = 0.5, mouseY = 0.5, mx = 0, my = 0, cx = 0, cy = 0, ks = 1, hot = false;

  /* ---------- Slow, smooth scrolling ---------- */
  var cur = window.scrollY, tgt = cur;

  function maxScroll() {
    return doc.scrollHeight - window.innerHeight;
  }

  if (!reduce && fine) {
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      tgt = clamp(tgt + e.deltaY * 0.85, 0, maxScroll());
    }, { passive: false });

    window.addEventListener("scroll", function () {
      if (Math.abs(window.scrollY - cur) > 2) {
        cur = tgt = window.scrollY;
      }
    });
  }

  function stepScroll() {
    if (reduce || !fine) return;
    var d = tgt - cur;
    if (Math.abs(d) > 0.1) {
      cur += d * 0.075;
      window.scrollTo(0, cur);
    }
  }

  /* ---------- Spark trail ---------- */
  var sk = document.getElementById("sparks"), sctx = sk.getContext("2d"), sp = [], lx = 0, ly = 0;

  function sizeSparks() {
    sk.width = window.innerWidth;
    sk.height = window.innerHeight;
  }

  function emit(x, y, n, pow) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = (0.5 + Math.random()) * pow;
      sp.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1 });
    }
  }

  function drawSparks() {
    sctx.clearRect(0, 0, sk.width, sk.height);
    sctx.lineWidth = 1.4;
    sctx.lineCap = "round";
    for (var i = sp.length - 1; i >= 0; i--) {
      var s = sp[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.93;
      s.vy *= 0.93;
      s.l -= 0.035;
      if (s.l <= 0) {
        sp.splice(i, 1);
        continue;
      }
      sctx.strokeStyle = "rgba(255,255,255," + s.l.toFixed(2) + ")";
      sctx.beginPath();
      sctx.moveTo(s.x, s.y);
      sctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
      sctx.stroke();
    }
  }

  /* ---------- Thunder scroll bar (left side) ---------- */
  var rail = document.querySelector(".thunder-rail");
  var trTrack = rail.querySelector(".tr-track");
  var trFill = rail.querySelector(".tr-fill");
  var trThumb = rail.querySelector(".tr-thumb");
  var trPct = rail.querySelector(".tr-pct");
  var bc = document.getElementById("bolts"), bctx = bc.getContext("2d");
  var bolts = [], flash = 0, lastBolt = 0, prevY = window.scrollY, rp = 0, tb = 0, bdirty = false;
  var railTop = 0, railH = 1, railX = 20, dragging = false;

  function sizeBolts() {
    bc.width = window.innerWidth;
    bc.height = window.innerHeight;
  }

  function measureRail() {
    var r = trTrack.getBoundingClientRect();
    railTop = r.top;
    railH = Math.max(1, r.height);
    railX = r.left + r.width / 2;
  }

  // Jagged line by random midpoint displacement
  function jag(x0, y0, x1, y1, disp, out) {
    if (disp < 3) {
      out.push([x0, y0, x1, y1]);
      return;
    }
    var mxp = (x0 + x1) / 2 + (Math.random() - 0.5) * disp;
    var myp = (y0 + y1) / 2 + (Math.random() - 0.5) * disp;
    jag(x0, y0, mxp, myp, disp / 2, out);
    jag(mxp, myp, x1, y1, disp / 2, out);
  }

  function spawnBolt(power) {
    var sx = railX + 6, sy = railTop + rp * railH;
    var len = window.innerWidth * (0.16 + Math.random() * 0.2) * (0.7 + power * 0.6);
    var ey = sy + (Math.random() - 0.3) * window.innerHeight * 0.45;
    var main = [], segs, n, k, base, br;
    jag(sx, sy, sx + len, ey, len * 0.35, main);
    segs = main.slice();
    n = 1 + Math.floor(Math.random() * 3);
    for (k = 0; k < n; k++) {
      base = main[Math.floor(Math.random() * main.length)];
      br = [];
      jag(base[0], base[1], base[0] + len * (0.2 + Math.random() * 0.3), base[1] + (Math.random() - 0.4) * len * 0.6, len * 0.18, br);
      segs = segs.concat(br);
    }
    bolts.push({ s: segs, life: 1 });
    flash = Math.min(1, flash + 0.5);
  }

  function drawBolts() {
    var i, b, a, gr;
    if (!bolts.length && flash <= 0) {
      if (bdirty) {
        bctx.clearRect(0, 0, bc.width, bc.height);
        bdirty = false;
      }
      return;
    }
    bdirty = true;
    bctx.clearRect(0, 0, bc.width, bc.height);
    if (flash > 0) {
      gr = bctx.createLinearGradient(0, 0, bc.width * 0.45, 0);
      gr.addColorStop(0, "rgba(220,230,255," + (0.12 * flash).toFixed(3) + ")");
      gr.addColorStop(1, "rgba(220,230,255,0)");
      bctx.fillStyle = gr;
      bctx.fillRect(0, 0, bc.width * 0.45, bc.height);
      flash *= 0.86;
      if (flash < 0.01) flash = 0;
    }
    bctx.lineJoin = "round";
    bctx.lineCap = "round";
    for (i = bolts.length - 1; i >= 0; i--) {
      b = bolts[i];
      b.life -= 0.065;
      if (b.life <= 0) {
        bolts.splice(i, 1);
        continue;
      }
      a = b.life * (0.6 + 0.4 * Math.random());
      bctx.beginPath();
      b.s.forEach(function (seg) {
        bctx.moveTo(seg[0], seg[1]);
        bctx.lineTo(seg[2], seg[3]);
      });
      bctx.strokeStyle = "rgba(170,190,255," + (0.2 * a).toFixed(3) + ")";
      bctx.lineWidth = 7;
      bctx.stroke();
      bctx.strokeStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      bctx.lineWidth = 1.6;
      bctx.stroke();
    }
  }

  function updateRail(time, y) {
    var vel = y - prevY, maxS = maxScroll(), frac = maxS > 0 ? y / maxS : 0, pc;
    prevY = y;
    rp += (frac - rp) * 0.14;
    tb += (clamp(Math.abs(vel) / 50, 0, 0.7) - tb) * 0.2;
    trFill.style.height = (rp * 100).toFixed(2) + "%";
    trThumb.style.transform = "translate3d(0," + (rp * railH).toFixed(1) + "px,0) rotate(-12deg) scale(" + (1 + tb).toFixed(3) + ")";
    trThumb.style.setProperty("--g", tb.toFixed(2));
    pc = Math.round(rp * 100);
    trPct.textContent = pc < 10 ? "0" + pc : "" + pc;

    // Thunder when scrolling down
    if (!reduce && vel > 5 && time - lastBolt > clamp(420 - vel * 9, 130, 420)) {
      spawnBolt(clamp(vel / 40, 0.2, 1));
      if (vel > 22) spawnBolt(clamp(vel / 40, 0.2, 1));
      lastBolt = time;
    }
    drawBolts();
  }

  function railTo(e) {
    var r = trTrack.getBoundingClientRect();
    var f = clamp((e.clientY - r.top) / r.height, 0, 1);
    var v = f * maxScroll();
    if (!reduce && fine) {
      tgt = v;
    } else {
      window.scrollTo(0, v);
    }
  }

  rail.addEventListener("pointerdown", function (e) {
    dragging = true;
    try { rail.setPointerCapture(e.pointerId); } catch (err) {}
    railTo(e);
    e.preventDefault();
  });
  rail.addEventListener("pointermove", function (e) {
    if (dragging) railTo(e);
  });
  ["pointerup", "pointercancel"].forEach(function (n) {
    rail.addEventListener(n, function () { dragging = false; });
  });

  /* ---------- Measure ---------- */
  function measure() {
    vh = window.innerHeight;
    layers.forEach(function (el) {
      el.style.transform = "";
      el._o = undefined;
      var r = el.getBoundingClientRect();
      el._c = r.top + window.scrollY + r.height / 2;
    });
    stories.forEach(function (s) {
      s._t = s.getBoundingClientRect().top + window.scrollY;
    });
    process._t = process.getBoundingClientRect().top + window.scrollY;
    sizeCanvas();
    sizeScene();
    sizeSparks();
    sizeBolts();
    measureRail();
  }

  /* ---------- Particle illustrations (process section) ---------- */
  var cv = document.getElementById("pc"), ctx = cv.getContext("2d");
  var N = 1300, W = 0, H = 0, dpr = 1;
  var px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  var shapes = [], shape = -1;

  function circle(x, y, r, n) {
    var a = [], i;
    n = n || 48;
    for (i = 0; i <= n; i++) {
      a.push([x + Math.cos(i / n * 6.2832) * r, y + Math.sin(i / n * 6.2832) * r]);
    }
    return a;
  }

  function rect(x, y, w, h) {
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  }

  function dia(s) {
    return [[0, -s], [s, 0], [0, s], [-s, 0], [0, -s]];
  }

  function sample(polys, n) {
    var segs = [], tot = 0, out = [], k, j;
    polys.forEach(function (p) {
      for (var i = 0; i < p.length - 1; i++) {
        var l = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]);
        segs.push([p[i], p[i + 1], l]);
        tot += l;
      }
    });
    for (k = 0; k < n; k++) {
      var t = Math.random() * tot, s = 0;
      for (j = 0; j < segs.length; j++) {
        if (t <= s + segs[j][2] || j === segs.length - 1) {
          var f = (t - s) / (segs[j][2] || 1), a = segs[j][0], b = segs[j][1];
          out.push(
            a[0] + (b[0] - a[0]) * f + (Math.random() - 0.5) * 0.022,
            a[1] + (b[1] - a[1]) * f + (Math.random() - 0.5) * 0.022
          );
          break;
        }
        s += segs[j][2];
      }
    }
    return out;
  }

  (function buildShapes() {
    var ladder = [[[-.62, -.9], [-.62, .9]], [[.62, -.9], [.62, .9]]], i, a, spokes = [], wave = [];
    [-.55, 0, .55].forEach(function (y) {
      ladder.push(
        [[-.62, y], [-.22, y]],
        [[-.22, y - .14], [-.22, y + .14]],
        [[-.08, y - .14], [-.08, y + .14]],
        [[-.08, y], [.62, y]]
      );
    });
    ladder.push(circle(.4, 0, .14, 24));
    for (i = 0; i < 6; i++) {
      a = i / 6 * 6.2832;
      spokes.push([[-.15 + Math.cos(a) * .2, Math.sin(a) * .2], [-.15 + Math.cos(a) * .62, Math.sin(a) * .62]]);
    }
    for (i = 0; i <= 40; i++) {
      wave.push([-.75 + i / 40 * 1.5, .12 + Math.sin(i / 40 * 12.566) * .22]);
    }
    shapes = [
      sample([dia(.95), dia(.55), circle(0, 0, .16, 32)], N),
      sample(ladder, N),
      sample([circle(-.15, 0, .62), circle(-.15, 0, .2, 32), rect(.47, -.09, .5, .18)].concat(spokes), N),
      sample([rect(-.9, -.62, 1.8, 1.24), [[-.9, -.38], [.9, -.38]], circle(-.78, -.5, .04, 12), circle(-.66, -.5, .04, 12), wave, [[0, .62], [0, .85]], [[-.3, .85], [.3, .85]]], N)
    ];
    for (i = 0; i < N; i++) {
      px[i] = (Math.random() - 0.5) * 2.4;
      py[i] = (Math.random() - 0.5) * 2.4;
    }
  })();

  function setShape(i) {
    if (i === shape) return;
    shape = i;
    for (var k = 0; k < N; k++) {
      vx[k] += (Math.random() - 0.5) * 0.05;
      vy[k] += (Math.random() - 0.5) * 0.05;
    }
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = W * dpr;
    cv.height = H * dpr;
  }

  function drawParticles(time) {
    // Smaller and higher, so it leaves a gap above the caption
    var S = Math.min(W * 0.36, H * 0.24), ox = W / 2, oy = H * 0.32;
    var T = shapes[Math.max(shape, 0)];
    var rc = cv.getBoundingClientRect();
    var mnx = (mouseX * window.innerWidth - rc.left - ox) / S;
    var mny = (mouseY * window.innerHeight - rc.top - oy) / S;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(240,241,244,.9)";
    for (var i = 0; i < N; i++) {
      var tx = T[i * 2], ty = T[i * 2 + 1];
      vx[i] += (tx - px[i]) * 0.011 + Math.sin(time * 0.0007 + i) * 0.00012;
      vy[i] += (ty - py[i]) * 0.011 + Math.cos(time * 0.0006 + i * 1.3) * 0.00012;
      var dx = px[i] - mnx, dy = py[i] - mny;
      if (dx * dx + dy * dy < 0.05) {
        vx[i] += dx * 0.012;
        vy[i] += dy * 0.012;
      }
      vx[i] *= 0.9;
      vy[i] *= 0.9;
      px[i] += vx[i];
      py[i] += vy[i];
      ctx.fillRect(ox + px[i] * S, oy + py[i] * S, 1.7, 1.7);
    }
  }

  /* ==========================================================
     WALLPAPER: factory interior + conveyor / robot arm / truck
     ========================================================== */
  var sc = document.getElementById("scene"), g = sc.getContext("2d");
  var SWd = 0, SHd = 0, sdpr = 1, S = 1, EXIT = 480;
  var LW = 1100, BG = "#08090c";
  var BX0 = 40, BX1 = 630, BY = 292, PICK = 600;
  var SLOTS = [802, 844, 886, 928], SERVOS = [100, 240, 380, 520], HOME = [700, 170];
  var SHLD = [690, 336], L1 = 150, L2 = 140;
  var gBig = new Path2D(gearD(100, 86, 20)), gSmall = new Path2D(gearD(60, 47, 12));
  var statEl = document.getElementById("cstat"), lastStat = "";
  var C = {
    items: [{ x: PICK }, { x: PICK - 62 }, { x: PICK - 124 }],
    spawn: 1, belt: 0, spin: 0,
    truck: { x: 0, state: "load", wait: 0, items: 0 },
    arm: { x: HOME[0], y: HOME[1], sx: 0, sy: 0, tx: 0, ty: 0, t: 0, d: 1, step: null, q: [], held: null }
  };

  function sizeScene() {
    sdpr = Math.min(window.devicePixelRatio || 1, 1.5);
    SWd = window.innerWidth;
    SHd = window.innerHeight;
    sc.width = SWd * sdpr;
    sc.height = SHd * sdpr;
    S = Math.min(SWd / 1120, 0.55 * SHd / 277);
    var ox0 = (SWd - LW * S) / 2;
    EXIT = Math.max(480, (SWd - ox0) / S - 760);
  }

  function tween(s) {
    var A = C.arm;
    A.step = s;
    A.sx = A.x;
    A.sy = A.y;
    A.tx = s[0];
    A.ty = s[1];
    A.t = 0;
    A.d = s[2];
  }

  function convUpdate(dt) {
    var T = C.truck, A = C.arm, i;
    if (T.state === "leave") {
      T.x = Math.min(EXIT, T.x + dt * (70 + T.x * 1.1));
      if (T.x >= EXIT) {
        T.state = "away";
        T.wait = 3.5;
      }
    } else if (T.state === "away") {
      T.wait -= dt;
      if (T.wait <= 0) T.state = "return";
    } else if (T.state === "return") {
      T.x = Math.max(0, T.x - dt * (70 + T.x * 1.1));
      if (T.x <= 0) {
        T.state = "load";
        T.items = 0;
      }
    }

    var run = T.state === "load";
    if (run) {
      C.belt += dt * 90;
      C.spin += dt * 6;
    }

    if (run) {
      C.spawn -= dt;
      var last = C.items[C.items.length - 1];
      if (C.spawn <= 0 && C.items.length < 8 && (!last || last.x > BX0 + 90)) {
        C.items.push({ x: BX0 + 10 });
        C.spawn = 1.4;
      }
      var limit = PICK;
      for (i = 0; i < C.items.length; i++) {
        C.items[i].x = Math.min(C.items[i].x + 90 * dt, limit);
        limit = C.items[i].x - 62;
      }
    }

    if (A.step) {
      A.t += dt;
      var k = Math.min(1, A.t / A.d);
      k = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      A.x = A.sx + (A.tx - A.sx) * k;
      A.y = A.sy + (A.ty - A.sy) * k;
      if (A.t >= A.d) {
        var s = A.step;
        A.step = null;
        if (s[3]) s[3]();
      }
    }

    if (!A.step) {
      if (A.q.length) {
        tween(A.q.shift());
      } else {
        var first = C.items[0];
        if (run && T.items < 4 && !A.held && first && first.x >= PICK - 1) {
          var sl = SLOTS[T.items];
          A.q = [
            [PICK, 185, 0.28],
            [PICK, 262, 0.16, function () { A.held = C.items.shift(); }],
            [PICK, 185, 0.16],
            [sl, 235, 0.3],
            [sl, 316, 0.16, function () { T.items++; A.held = null; }],
            [sl, 235, 0.16]
          ];
        } else if (run && T.items >= 4 && !A.held) {
          T.state = "leave";
        } else {
          var want = (run && T.items < 4) ? [PICK, 185] : HOME;
          if (Math.hypot(A.x - want[0], A.y - want[1]) > 2) {
            tween([want[0], want[1], 0.5]);
          }
        }
      }
    }

    var msg = run ? "Conveyor running, servo drives on"
      : T.state === "leave" ? "Truck loaded and leaving, conveyor stopped"
      : T.state === "away" ? "Truck away, conveyor and servo drives stopped"
      : "Truck returning, conveyor starts when it arrives";
    if (msg !== lastStat) {
      lastStat = msg;
      statEl.textContent = msg;
    }
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function motor(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    rr(c, -20, -13, 34, 26, 3);
    c.fill();
    c.stroke();
    rr(c, 14, -11, 5, 22, 1);
    c.fill();
    c.stroke();
    c.fillRect(19, -4, 9, 8);
    c.strokeRect(19, -4, 9, 8);
    c.beginPath();
    for (var i = -14; i <= 0; i += 5) {
      c.moveTo(i, -13);
      c.lineTo(i, -8);
      c.moveTo(i, 13);
      c.lineTo(i, 8);
    }
    c.stroke();
    c.restore();
  }

  function capsule(c, x1, y1, x2, y2, w) {
    c.lineCap = "round";
    c.strokeStyle = "rgba(255,255,255,.9)";
    c.lineWidth = w + 2.6;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.strokeStyle = BG;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.85)";
    c.lineWidth = 1.4;
    c.lineCap = "butt";
  }

  function joint(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, 6.283);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(x, y, r * 0.35, 0, 6.283);
    c.stroke();
  }

  /* Factory interior, drawn in screen space behind the line */
  function drawFactory(c, t, y) {
    var Wd = SWd, Hd = SHd, fl = Hd * 0.88, px = mx * -26, i, k, x;
    var top = Hd * 0.07, bot = Hd * 0.16;
    c.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    c.clearRect(0, 0, Wd, Hd);
    c.lineWidth = 1;
    c.fillStyle = "rgba(0,0,0,0)";

    // Roof truss
    c.strokeStyle = "rgba(255,255,255,.16)";
    c.beginPath();
    c.moveTo(0, top);
    c.lineTo(Wd, top);
    c.moveTo(0, bot);
    c.lineTo(Wd, bot);
    for (x = -90 + (px % 90); x < Wd + 90; x += 90) {
      c.moveTo(x, bot);
      c.lineTo(x + 45, top);
      c.lineTo(x + 90, bot);
    }
    c.stroke();

    // Windows on the back wall (between columns)
    for (i = 0; i < 5; i++) {
      var wx = Wd * (0.08 + 0.22 * i) + px + 28, ww = Wd * 0.22 - 56, wy = Hd * 0.27, wh = Hd * 0.22;
      var lit = 0.02 + 0.025 * (0.5 + 0.5 * Math.sin(t * 0.0006 + i * 2.1));
      c.fillStyle = "rgba(255,255,255," + lit.toFixed(3) + ")";
      c.fillRect(wx, wy, ww, wh);
      c.strokeStyle = "rgba(255,255,255,.13)";
      c.strokeRect(wx, wy, ww, wh);
      c.beginPath();
      for (k = 1; k < 4; k++) {
        c.moveTo(wx + ww * k / 4, wy);
        c.lineTo(wx + ww * k / 4, wy + wh);
      }
      c.moveTo(wx, wy + wh * 0.5);
      c.lineTo(wx + ww, wy + wh * 0.5);
      c.stroke();
    }

    // Steel columns
    c.strokeStyle = "rgba(255,255,255,.13)";
    c.beginPath();
    for (i = 0; i < 5; i++) {
      x = Wd * (0.08 + 0.22 * i) + px;
      c.moveTo(x - 7, bot);
      c.lineTo(x - 7, fl);
      c.moveTo(x + 7, bot);
      c.lineTo(x + 7, fl);
      c.moveTo(x - 13, fl);
      c.lineTo(x + 13, fl);
      for (k = bot + 50; k < fl; k += 60) {
        c.moveTo(x - 7, k);
        c.lineTo(x + 7, k + 14);
      }
    }
    c.stroke();

    // Wall gears (turn with time and scroll)
    var ang = t * 0.00022 + y * 0.0007;
    c.strokeStyle = "rgba(255,255,255,.2)";
    c.save();
    c.translate(Wd * 0.12, Hd * 0.37);
    c.scale(0.8, 0.8);
    c.rotate(ang);
    c.stroke(gBig);
    c.beginPath();
    c.arc(0, 0, 30, 0, 6.283);
    c.stroke();
    c.restore();

    c.save();
    c.translate(Wd * 0.12 + 130, Hd * 0.37 - 80);
    c.scale(0.8, 0.8);
    c.rotate(-ang * 20 / 12 + 0.26);
    c.stroke(gSmall);
    c.beginPath();
    c.arc(0, 0, 18, 0, 6.283);
    c.stroke();
    c.restore();

    // Pipe run with flowing dashes
    c.strokeStyle = "rgba(255,255,255,.15)";
    c.beginPath();
    c.moveTo(0, Hd * 0.212);
    c.lineTo(Wd, Hd * 0.212);
    c.moveTo(0, Hd * 0.236);
    c.lineTo(Wd, Hd * 0.236);
    for (i = 0; i < 5; i++) {
      x = Wd * (0.08 + 0.22 * i) + px + 40;
      c.moveTo(x, Hd * 0.236);
      c.lineTo(x, Hd * 0.3);
      c.lineTo(x + 18, Hd * 0.3);
    }
    c.stroke();
    c.save();
    c.setLineDash([8, 24]);
    c.lineDashOffset = -((t * 0.03) % 32);
    c.strokeStyle = "rgba(255,255,255,.42)";
    c.beginPath();
    c.moveTo(0, Hd * 0.224);
    c.lineTo(Wd, Hd * 0.224);
    c.stroke();
    c.restore();

    // Overhead crane: rail, trolley, swinging cable and crate
    var cy0 = Hd * 0.19;
    c.strokeStyle = "rgba(255,255,255,.2)";
    c.beginPath();
    c.moveTo(0, cy0);
    c.lineTo(Wd, cy0);
    c.stroke();
    var bx = Wd * (0.5 + 0.36 * Math.sin(t * 0.00011)) + px;
    var len = Hd * 0.09 + Hd * 0.03 * Math.sin(t * 0.0005), sw = Math.sin(t * 0.0008) * 7;
    c.strokeStyle = "rgba(255,255,255,.42)";
    c.fillStyle = BG;
    rr(c, bx - 26, cy0 - 7, 52, 14, 3);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(bx - 16, cy0 + 7, 3, 0, 6.283);
    c.arc(bx + 16, cy0 + 7, 3, 0, 6.283);
    c.stroke();
    c.beginPath();
    c.moveTo(bx, cy0 + 7);
    c.lineTo(bx + sw, cy0 + len);
    c.stroke();
    c.beginPath();
    c.arc(bx + sw, cy0 + len + 5, 5, 0, 6.283);
    c.stroke();
    c.strokeRect(bx + sw - 30, cy0 + len + 10, 60, 38);
    c.beginPath();
    c.moveTo(bx + sw - 30, cy0 + len + 10);
    c.lineTo(bx + sw + 30, cy0 + len + 48);
    c.moveTo(bx + sw + 30, cy0 + len + 10);
    c.lineTo(bx + sw - 30, cy0 + len + 48);
    c.stroke();

    // Hanging lamps with soft light cones
    for (i = 0; i < 4; i++) {
      var lx = Wd * (0.18 + 0.22 * i) + px * 1.2, ly = bot + Hd * 0.035;
      var fk = i === 2 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 0.013) * Math.sin(t * 0.0031)) : 1;
      var gr = c.createLinearGradient(0, ly + 16, 0, fl);
      gr.addColorStop(0, "rgba(255,255,255," + (0.07 * fk).toFixed(3) + ")");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(lx - 22, ly + 16);
      c.lineTo(lx + 22, ly + 16);
      c.lineTo(lx + 190, fl);
      c.lineTo(lx - 190, fl);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(255,255,255,.3)";
      c.beginPath();
      c.moveTo(lx, bot);
      c.lineTo(lx, ly);
      c.moveTo(lx - 14, ly);
      c.lineTo(lx + 14, ly);
      c.lineTo(lx + 22, ly + 16);
      c.lineTo(lx - 22, ly + 16);
      c.closePath();
      c.stroke();
    }

    // Floor lines in perspective
    c.strokeStyle = "rgba(255,255,255,.08)";
    c.beginPath();
    for (k = -10; k <= 10; k++) {
      c.moveTo(Wd / 2 + k * 40, fl);
      c.lineTo(Wd / 2 + k * Wd * 0.11 + px * 2, Hd);
    }
    for (k = 1; k <= 5; k++) {
      var fy = fl + (Hd - fl) * Math.pow(k / 5, 2);
      c.moveTo(0, fy);
      c.lineTo(Wd, fy);
    }
    c.stroke();
  }

  /* Conveyor line, drawn in scene space (1100 x ~430) scaled to the screen */
  function convDraw(c, y) {
    var T = C.truck, A = C.arm, i, x;
    var ox = (SWd - LW * S) / 2 + mx * -40, fl = SHd * 0.88, oy = fl - 367 * S + Math.sin(y / 2200) * 14;
    c.setTransform(sdpr * S, 0, 0, sdpr * S, sdpr * ox, sdpr * oy);
    var xs0 = -ox / S - 20, xs1 = (SWd - ox) / S + 20;
    c.lineWidth = 1.4;
    c.strokeStyle = "rgba(255,255,255,.85)";
    c.fillStyle = BG;
    c.font = "9px 'JetBrains Mono', monospace";

    // Floor
    c.save();
    c.setLineDash([8, 10]);
    c.strokeStyle = "rgba(255,255,255,.35)";
    c.beginPath();
    c.moveTo(xs0, 367);
    c.lineTo(xs1, 367);
    c.stroke();
    c.restore();

    // Belt legs and body
    c.beginPath();
    [80, 340, 600].forEach(function (lx) {
      c.moveTo(lx, 310);
      c.lineTo(lx, 367);
      c.moveTo(lx - 14, 367);
      c.lineTo(lx + 14, 367);
    });
    c.stroke();
    rr(c, BX0, BY, BX1 - BX0, 18, 9);
    c.fill();
    c.stroke();
    c.save();
    c.strokeStyle = "rgba(255,255,255,.4)";
    c.beginPath();
    for (x = BX0 + 14 + (C.belt % 24); x < BX1 - 14; x += 24) {
      c.moveTo(x, BY);
      c.lineTo(x, BY + 4);
    }
    c.stroke();
    c.restore();

    for (x = 60; x <= 610; x += 70) {
      c.beginPath();
      c.arc(x, 301, 6, 0, 6.283);
      c.stroke();
      c.beginPath();
      c.moveTo(x, 301);
      c.lineTo(x + Math.cos(C.spin) * 6, 301 + Math.sin(C.spin) * 6);
      c.stroke();
    }

    // Servo motors under the belt
    SERVOS.forEach(function (sx, n) {
      c.beginPath();
      c.moveTo(sx - 4, 310);
      c.lineTo(sx - 4, 322);
      c.moveTo(sx + 4, 310);
      c.lineTo(sx + 4, 322);
      c.stroke();
      rr(c, sx - 26, 322, 52, 32, 4);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(sx + 10, 322);
      c.lineTo(sx + 10, 354);
      c.moveTo(sx + 16, 322);
      c.lineTo(sx + 16, 354);
      c.moveTo(sx + 22, 322);
      c.lineTo(sx + 22, 354);
      c.stroke();
      c.beginPath();
      c.arc(sx - 10, 338, 9, 0, 6.283);
      c.stroke();
      c.beginPath();
      c.moveTo(sx - 10, 338);
      c.lineTo(sx - 10 + Math.cos(C.spin * 2) * 9, 338 + Math.sin(C.spin * 2) * 9);
      c.stroke();
      c.fillStyle = "rgba(255,255,255,.5)";
      c.fillText("SERVO " + (n + 1), sx - 22, 384);
      c.fillStyle = BG;
    });
    c.fillStyle = "rgba(255,255,255,.5)";
    c.fillText("CONVEYOR", BX0, 404);
    c.fillText("PICK AND PLACE ARM", 640, 404);
    c.fillStyle = BG;

    C.items.forEach(function (it) {
      motor(c, it.x, BY - 15, 1);
    });

    // Robot arm
    c.beginPath();
    c.moveTo(656, 367);
    c.lineTo(656, 352);
    c.lineTo(724, 352);
    c.lineTo(724, 367);
    c.stroke();
    rr(c, 666, 340, 48, 12, 2);
    c.fill();
    c.stroke();
    var wx = A.x, wy = A.y - 22, dx = wx - SHLD[0], dy = wy - SHLD[1];
    var d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.5), a = Math.atan2(dy, dx);
    var b = Math.acos(clamp((d * d + L1 * L1 - L2 * L2) / (2 * d * L1), -1, 1));
    var e1 = [SHLD[0] + L1 * Math.cos(a + b), SHLD[1] + L1 * Math.sin(a + b)];
    var e2 = [SHLD[0] + L1 * Math.cos(a - b), SHLD[1] + L1 * Math.sin(a - b)];
    var E = e1[1] < e2[1] ? e1 : e2;
    capsule(c, SHLD[0], SHLD[1], E[0], E[1], 13);
    capsule(c, E[0], E[1], wx, wy, 11);
    joint(c, SHLD[0], SHLD[1], 10);
    joint(c, E[0], E[1], 8);
    joint(c, wx, wy, 6);
    var gap = A.held ? 17 : 23, ty = A.y;
    c.fillRect(wx - 5, wy, 10, 12);
    c.strokeRect(wx - 5, wy, 10, 12);
    c.beginPath();
    c.moveTo(wx - gap, ty - 10);
    c.lineTo(wx - gap, ty + 9);
    c.lineTo(wx - gap + 5, ty + 9);
    c.moveTo(wx + gap, ty - 10);
    c.lineTo(wx + gap, ty + 9);
    c.lineTo(wx + gap - 5, ty + 9);
    c.moveTo(wx - gap, ty - 10);
    c.lineTo(wx + gap, ty - 10);
    c.stroke();
    if (A.held) {
      var hs = 1 - 0.25 * clamp((A.x - PICK) / (SLOTS[0] - PICK), 0, 1);
      motor(c, A.x, A.y + 15 * hs, hs);
    }

    // Truck
    c.save();
    c.translate(T.x, 0);
    rr(c, 780, 300, 180, 38, 2);
    c.fill();
    c.stroke();
    for (i = 0; i < T.items; i++) {
      motor(c, SLOTS[i], 327, 0.75);
    }
    c.beginPath();
    c.moveTo(960, 338);
    c.lineTo(960, 304);
    c.lineTo(1004, 304);
    c.lineTo(1040, 326);
    c.lineTo(1040, 338);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(968, 311);
    c.lineTo(1000, 311);
    c.lineTo(1022, 325);
    c.lineTo(968, 325);
    c.closePath();
    c.stroke();
    [812, 900, 1006].forEach(function (wxx) {
      c.beginPath();
      c.arc(wxx, 352, 15, 0, 6.283);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(wxx, 352, 5, 0, 6.283);
      c.stroke();
      var r = -T.x * 0.07;
      c.beginPath();
      for (var k = 0; k < 3; k++) {
        c.moveTo(wxx, 352);
        c.lineTo(wxx + Math.cos(r + k * 2.094) * 14, 352 + Math.sin(r + k * 2.094) * 14);
      }
      c.stroke();
    });
    c.fillStyle = "rgba(255,255,255,.5)";
    c.fillText("TRUCK", 850, 404);
    c.restore();
  }

  /* ---------- Frame loop ---------- */
  var lastT = 0;

  function frame(time) {
    var dt = Math.min(0.05, (time - lastT) / 1000 || 0.016);
    lastT = time;
    stepScroll();
    var y = window.scrollY;
    mx += (mouseX - 0.5 - mx) * 0.05;
    my += (mouseY - 0.5 - my) * 0.05;

    // Wallpaper
    convUpdate(reduce ? 0 : dt);
    drawFactory(g, time, y);
    convDraw(g, y);

    // Section layers with inertia for smooth parallax
    if (!reduce) {
      layers.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-speed")), d = el._c - (y + vh / 2);
        if (Math.abs(d) > vh * 1.6) {
          el.style.transform = "";
          el._o = undefined;
          return;
        }
        var t = -d * s;
        el._o = el._o === undefined ? t : el._o + (t - el._o) * 0.1;
        var x = (el.classList.contains("deco") || el.classList.contains("chip")) ? mx * s * -140 : 0;
        el.style.transform = "translate3d(" + x + "px," + el._o + "px,0)";
      });
    }

    // Process: sticky split screen
    var pp = clamp((y - process._t) / (process.offsetHeight - vh), 0, 1);
    var u = pp * 4, idx = clamp(Math.floor(u), 0, 3);
    setShape(idx);
    termLines.forEach(function (li, i) {
      li.classList.toggle("on", i === idx);
    });
    steps.forEach(function (st, i) {
      var l = u - i, inn = smooth(clamp(l / 0.18, 0, 1)), out = i === 3 ? 0 : smooth(clamp((l - 0.82) / 0.18, 0, 1));
      st.style.opacity = inn * (1 - out);
      st.style.transform = "translateY(calc(-50% + " + ((1 - inn) * 60 - out * 60) + "px))";
    });
    var pr = process.getBoundingClientRect();
    if (pr.bottom > 0 && pr.top < vh) drawParticles(time);

    // Certificate stories
    stories.forEach(function (st) {
      var top = st._t - y;
      if (top < -st.offsetHeight - 60 || top > vh + 60) return;
      var p = clamp(-top / (st.offsetHeight - vh), 0, 1);
      var fr = st.querySelector(".frame"), txt = st.querySelector(".ctext"), parts = txt.children;
      if (reduce) return;
      var enter = ease(clamp(p / 0.28, 0, 1)), exit = ease(clamp((p - 0.86) / 0.14, 0, 1));
      var ta = 0;
      fr.style.opacity = enter * (1 - exit);
      fr.style.transform = "translate3d(" + (mx * 20) + "px," + ((1 - enter) * 140 - exit * 120) + "px,0) rotateY(" + ((0.5 - p) * 16 + mx * 8) + "deg) rotateX(" + (my * -6 + (1 - enter) * 10) + "deg)";
      var starts = [0.34, 0.42, 0.5, 0.58, 0.66];
      for (var i = 0; i < parts.length; i++) {
        var t = ease(clamp((p - starts[i]) / 0.1, 0, 1));
        if (i === 0) ta = t * (1 - exit);
        parts[i].style.opacity = t * (1 - exit);
        parts[i].style.transform = "translate3d(0," + ((1 - t) * 26 - exit * 60) + "px,0)";
      }
      txt.style.setProperty("--ta", ta.toFixed(3));
      txt.style.transform = "translate3d(0," + ((0.5 - p) * -30) + "px,0)";
    });

    // Lightning cursor and sparks
    cx += (mouseX * window.innerWidth - cx) * 0.2;
    cy += (mouseY * window.innerHeight - cy) * 0.2;
    ks += ((hot ? 1.5 : 1) - ks) * 0.15;
    if (cursor) {
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0) rotate(-12deg) scale(" + ks.toFixed(3) + ")";
    }
    drawSparks();

    // Thunder scroll bar
    updateRail(time, y);

    requestAnimationFrame(frame);
  }

  /* ---------- Events ---------- */
  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
    if (cursor) cursor.classList.add("on");
    if (fine && Math.hypot(e.clientX - lx, e.clientY - ly) > 14) {
      emit(e.clientX, e.clientY, 2, 2.2);
    }
    lx = e.clientX;
    ly = e.clientY;
  });

  window.addEventListener("click", function (e) {
    if (fine) emit(e.clientX, e.clientY, 16, 5);
  });

  if (fine) {
    doc.classList.add("has-cursor");
    document.querySelectorAll("a,.btn,.pills li").forEach(function (el) {
      el.addEventListener("mouseenter", function () { hot = true; });
      el.addEventListener("mouseleave", function () { hot = false; });
    });
  } else if (cursor) {
    cursor.style.display = "none";
    sk.style.display = "none";
  }

  window.addEventListener("resize", measure);
  window.addEventListener("load", function () {
    measure();
    requestAnimationFrame(function () {
      doc.classList.add("loaded");
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      tgt = clamp(t.getBoundingClientRect().top + window.scrollY, 0, maxScroll());
      if (reduce || !fine) window.scrollTo({ top: tgt, behavior: "smooth" });
    });
  });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".rv").forEach(function (el) {
    io.observe(el);
  });

  measure();
  requestAnimationFrame(frame);
})();
