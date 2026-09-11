import { computeBike, BEAD_SEAT, MM_PER_INCH } from './geometry.js';
import { PRESETS } from './presets.js';

// ---------------------------------------------------------------------------
// Input schema: id, label, group, unit, step. Values live in `state`.
// ---------------------------------------------------------------------------
const FRAME_FIELDS = [
  ['stack', 'Stack', 'mm', 1],
  ['reach', 'Reach', 'mm', 1],
  ['headAngle', 'Head tube angle', '°', 0.1],
  ['seatAngle', 'Seat tube angle', '°', 0.1],
  ['headTubeLength', 'Head tube length', 'mm', 1],
  ['chainstay', 'Chainstay', 'mm', 1],
  ['bbDrop', 'BB drop', 'mm', 1],
  ['forkOffset', 'Fork offset (rake)', 'mm', 1],
  ['seatTubeLength', 'Seat tube (c–t)', 'mm', 1],
  ['wheelbase', 'Wheelbase (chart, optional)', 'mm', 1],
];
const WHEEL_FIELDS = [
  ['tireWidth', 'Tire width', 'mm', 1],
];
const COCKPIT_FIELDS = [
  ['stemLength', 'Stem length', 'mm', 1],
  ['stemAngle', 'Stem angle', '°', 1],
  ['spacers', 'Spacers under stem', 'mm', 1],
  ['headsetTopCap', 'Headset top cap', 'mm', 1],
  ['barReach', 'Bar reach (drop bars)', 'mm', 1],
  ['barDrop', 'Bar drop (drop bars)', 'mm', 1],
  ['barRise', 'Bar rise (flat bars)', 'mm', 1],
];
const SADDLE_FIELDS = [
  ['saddleHeight', 'Saddle height (BB→top)', 'mm', 1],
  ['saddleSetback', 'Saddle setback', 'mm', 1],
  ['saddleLength', 'Saddle length', 'mm', 1],
  ['crankLength', 'Crank length', 'mm', 0.5],
];

let state = null;      // { frame:{}, components:{} }
let units = 'mm';

function clone(o) { return JSON.parse(JSON.stringify(o)); }

// ---------------------------------------------------------------------------
// Build controls
// ---------------------------------------------------------------------------
const presetSel = document.getElementById('preset');
for (const name of Object.keys(PRESETS)) {
  const opt = document.createElement('option');
  opt.value = name; opt.textContent = name;
  presetSel.appendChild(opt);
}
presetSel.addEventListener('change', () => loadPreset(presetSel.value));
document.getElementById('resetBtn').addEventListener('click', () => loadPreset(presetSel.value));

document.getElementById('unitSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  units = b.dataset.u;
  for (const btn of e.currentTarget.querySelectorAll('button'))
    btn.classList.toggle('on', btn === b);
  update();
});

function makeRow(container, key, label, unit, step, obj) {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('label');
  lab.textContent = label;
  lab.htmlFor = 'in_' + key;
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.id = 'in_' + key;
  inp.step = step;
  inp.addEventListener('input', () => {
    const v = parseFloat(inp.value);
    if (!Number.isFinite(v)) return;
    obj()[key] = v;
    update();
  });
  row.append(lab, inp);
  container.appendChild(row);
  return inp;
}

const inputs = {};
function buildInputs() {
  const fi = document.getElementById('frameInputs');
  const wi = document.getElementById('wheelInputs');
  const ci = document.getElementById('cockpitInputs');
  const si = document.getElementById('saddleInputs');

  for (const [k, l, u, s] of FRAME_FIELDS) inputs[k] = makeRow(fi, k, l, u, s, () => state.frame);

  // Wheel size dropdown
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('label');
  lab.textContent = 'Wheel size';
  const sel = document.createElement('select');
  for (const [name, bsd] of Object.entries(BEAD_SEAT)) {
    const o = document.createElement('option');
    o.value = bsd; o.textContent = name;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => { state.components.beadSeat = +sel.value; update(); });
  row.append(lab, sel);
  wi.appendChild(row);
  inputs.beadSeat = sel;

  for (const [k, l, u, s] of WHEEL_FIELDS) inputs[k] = makeRow(wi, k, l, u, s, () => state.components);
  for (const [k, l, u, s] of COCKPIT_FIELDS) inputs[k] = makeRow(ci, k, l, u, s, () => state.components);
  for (const [k, l, u, s] of SADDLE_FIELDS) inputs[k] = makeRow(si, k, l, u, s, () => state.components);
}

function loadPreset(name) {
  state = clone(PRESETS[name]);
  for (const [k, v] of Object.entries(state.frame)) if (inputs[k]) inputs[k].value = v;
  for (const [k, v] of Object.entries(state.components)) if (inputs[k]) inputs[k].value = v;
  update();
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------
const RESULT_ROWS = [
  ['overallLength', 'Overall length', true],
  ['overallHeight', 'Overall height', true],
  ['wheelbase', 'Wheelbase (derived)', true],
  ['frontCenter', 'Front center', false],
  ['rearCenter', 'Rear center (chainstay)', false],
  ['trail', 'Trail', false],
  ['bbHeightAboveGround', 'BB height', false],
  ['pedalGroundClearance', 'Pedal clearance (6 o’clock)', false],
  ['effectiveTopTube', 'Effective top tube', false],
  ['standover', 'Standover (approx.)', false],
  ['saddleHeightAboveGround', 'Saddle height (ground)', false],
  ['barHeightAboveGround', 'Bar height (ground)', false],
  ['handlebarX', 'Handlebar X (fit HX)', false],
  ['handlebarY', 'Handlebar Y (fit HY)', false],
  ['saddleBarDrop', 'Saddle–bar drop', false],
  ['saddleBarReach', 'Saddle–bar reach', false],
  ['wheelDiameter', 'Wheel outer diameter', false],
];

function fmtVal(mm) {
  if (units === 'in') return (mm / MM_PER_INCH).toFixed(1) + '″';
  return Math.round(mm) + ' mm';
}

function renderResults(derived, warnings) {
  const box = document.getElementById('results');
  box.innerHTML = '';
  for (const [key, label, hero] of RESULT_ROWS) {
    const d = document.createElement('div');
    d.className = 'result' + (hero ? ' hero' : '');
    d.innerHTML = `<span class="k">${label}</span><span class="v">${fmtVal(derived[key])}</span>`;
    box.appendChild(d);
  }
  const w = document.getElementById('warnings');
  w.textContent = warnings.join(' ');
  w.classList.toggle('show', warnings.length > 0);
}

// ---------------------------------------------------------------------------
// SVG drawing
// ---------------------------------------------------------------------------
const svg = document.getElementById('drawing');
const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  (parent ?? svg).appendChild(e);
  return e;
}

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function render(bike) {
  const { points: P, derived: D } = bike;
  svg.innerHTML = '';

  const Rw = D.wheelRadius;
  const ground = P.groundY;

  // World bounding box (mm) with margins for dimension annotations.
  const minX = Math.min(P.rearAxle.x - Rw, P.saddleTop.x - 160) - 150;
  const maxX = Math.max(P.frontAxle.x + Rw, P.gripCenter.x + 40) + 170;
  const topY = Math.max(P.saddleTop.y + 60, P.barClamp.y + 60, ground + 2 * Rw + 20) + 60;
  const botY = ground - 130;
  const W = maxX - minX, H = topY - botY;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.aspectRatio = `${W} / ${H}`;

  const X = (x) => x - minX;
  const Y = (y) => topY - y;

  const FRAME = css('--frame'), TIRE = css('--tire'), RIM = css('--rim');
  const DIM = css('--dim'), DIMTEXT = css('--dimtext'), MUTED = css('--muted');
  const ACC2 = css('--accent2');

  // Ground
  el('line', { x1: X(minX), y1: Y(ground), x2: X(maxX), y2: Y(ground),
    stroke: MUTED, 'stroke-width': 2 });
  for (let gx = minX + 20; gx < maxX; gx += 60) {
    el('line', { x1: X(gx), y1: Y(ground), x2: X(gx - 18), y2: Y(ground) + 12,
      stroke: MUTED, 'stroke-width': 1, opacity: 0.5 });
  }

  // Wheels
  for (const a of [P.rearAxle, P.frontAxle]) {
    el('circle', { cx: X(a.x), cy: Y(a.y), r: Rw - state.components.tireWidth / 2,
      fill: 'none', stroke: TIRE, 'stroke-width': state.components.tireWidth });
    el('circle', { cx: X(a.x), cy: Y(a.y), r: Rw - state.components.tireWidth,
      fill: 'none', stroke: RIM, 'stroke-width': 5 });
    el('circle', { cx: X(a.x), cy: Y(a.y), r: 10, fill: RIM });
  }

  // Frame tubes
  const tube = (a, b, w = 22) => el('line', {
    x1: X(a.x), y1: Y(a.y), x2: X(b.x), y2: Y(b.y),
    stroke: FRAME, 'stroke-width': w, 'stroke-linecap': 'round' });

  tube(P.bb, P.seatTubeTop);                  // seat tube
  tube(P.bb, P.htBottom, 26);                 // down tube
  tube(P.seatTubeTop, P.htTop, 20);           // top tube
  tube(P.htTop, P.htBottom, 30);              // head tube
  tube(P.bb, P.rearAxle, 12);                 // chainstay
  tube(P.seatTubeTop, P.rearAxle, 10);        // seat stay
  tube(P.htBottom, P.frontAxle, 14);          // fork

  // Seatpost + saddle
  tube(P.seatTubeTop, { x: P.saddleTop.x + state.components.saddleSetback, y: P.saddleTop.y - 15 }, 10);
  el('rect', {
    x: X(P.saddleTop.x - state.components.saddleLength / 2),
    y: Y(P.saddleTop.y) - 10,
    width: state.components.saddleLength, height: 16, rx: 8, fill: FRAME });

  // Steerer/spacers + stem + bar
  tube(P.htTop, P.stemClamp, 16);
  tube(P.stemClamp, P.barClamp, 16);
  el('circle', { cx: X(P.barClamp.x), cy: Y(P.barClamp.y), r: 12, fill: FRAME });
  if (state.components.barReach > 5) {
    // drop bar: forward reach, then a hook down to the drops position
    const hx = P.gripCenter.x, hy = P.gripCenter.y;
    const bd = Math.max(60, state.components.barDrop ?? 130);
    el('path', {
      d: `M ${X(P.barClamp.x)} ${Y(P.barClamp.y)} L ${X(hx)} ${Y(hy)}
          Q ${X(hx + 35)} ${Y(hy - bd * 0.1)}, ${X(hx + 25)} ${Y(hy - bd * 0.55)}
          Q ${X(hx + 15)} ${Y(hy - bd * 0.95)}, ${X(P.drops.x - 35)} ${Y(P.drops.y)}`,
      fill: 'none', stroke: FRAME, 'stroke-width': 12, 'stroke-linecap': 'round' });
  } else {
    // flat/riser bar seen from the side: short rise
    tube(P.barClamp, P.gripCenter, 12);
    el('circle', { cx: X(P.gripCenter.x), cy: Y(P.gripCenter.y), r: 9, fill: RIM });
  }

  // Crank + pedals + chainring
  const cl = state.components.crankLength;
  el('circle', { cx: X(0), cy: Y(0), r: 55, fill: 'none', stroke: RIM, 'stroke-width': 4 });
  tube(P.bb, { x: cl * 0.42, y: -cl * 0.91 }, 12);
  tube(P.bb, { x: -cl * 0.42, y: cl * 0.91 }, 12);
  el('rect', { x: X(cl * 0.42) - 30, y: Y(-cl * 0.91) - 6, width: 60, height: 12, rx: 4, fill: RIM });
  el('circle', { cx: X(0), cy: Y(0), r: 14, fill: FRAME });

  // BB marker
  el('circle', { cx: X(0), cy: Y(0), r: 5, fill: DIM });

  // --- Dimension annotations ----------------------------------------------
  const dimLine = (x1, y1, x2, y2, label, opts = {}) => {
    const g = el('g', {});
    el('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2),
      stroke: DIM, 'stroke-width': 2 }, g);
    // arrowheads
    for (const [px, py, qx, qy] of [[x1, y1, x2, y2], [x2, y2, x1, y1]]) {
      const ang = Math.atan2(Y(qy) - Y(py), X(qx) - X(px));
      const ax = X(px), ay = Y(py);
      el('path', { d: `M ${ax} ${ay}
        L ${ax + 14 * Math.cos(ang - 0.35)} ${ay + 14 * Math.sin(ang - 0.35)}
        L ${ax + 14 * Math.cos(ang + 0.35)} ${ay + 14 * Math.sin(ang + 0.35)} Z`,
        fill: DIM }, g);
    }
    const mx = X((x1 + x2) / 2) + (opts.dx ?? 0);
    const my = Y((y1 + y2) / 2) + (opts.dy ?? -8);
    el('text', { x: mx, y: my, fill: DIMTEXT, 'font-size': 26,
      'text-anchor': opts.anchor ?? 'middle', 'font-weight': 600,
      ...(opts.rotate ? { transform: `rotate(-90 ${mx} ${my})` } : {}) }, g)
      .textContent = label;
    return g;
  };
  const ext = (x, y1, y2) => el('line', { x1: X(x), y1: Y(y1), x2: X(x), y2: Y(y2),
    stroke: DIM, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.7 });

  // Overall length (lowest band)
  const oLeft = Math.min(P.rearAxle.x - Rw, P.saddleTop.x - state.components.saddleLength / 2);
  const oRight = Math.max(P.frontAxle.x + Rw, P.gripCenter.x);
  ext(oLeft, ground, ground - 105);
  ext(oRight, ground, ground - 105);
  dimLine(oLeft, ground - 95, oRight, ground - 95, `length ${fmtVal(D.overallLength)}`, { dy: -8 });

  // Wheelbase (upper band, between axle verticals)
  ext(P.rearAxle.x, P.rearAxle.y, ground - 55);
  ext(P.frontAxle.x, P.frontAxle.y, ground - 55);
  dimLine(P.rearAxle.x, ground - 45, P.frontAxle.x, ground - 45, `wheelbase ${fmtVal(D.wheelbase)}`, { dy: -8 });

  // Overall height (right side); leader starts at the tallest element
  const hTop = D.overallHeight + ground;
  const hx = maxX - 60;
  const tallest = [
    { y: P.saddleTop.y + 40, x: P.saddleTop.x },
    { y: P.barClamp.y + 20, x: P.barClamp.x },
    { y: P.gripCenter.y + 20, x: P.gripCenter.x },
    { y: P.frontAxle.y + Rw, x: P.frontAxle.x },
  ].reduce((a, b) => (b.y > a.y ? b : a));
  el('line', { x1: X(tallest.x), y1: Y(hTop), x2: X(hx), y2: Y(hTop),
    stroke: DIM, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.7 });
  dimLine(hx, ground, hx, hTop, `height ${fmtVal(D.overallHeight)}`, { rotate: true, dy: -10 });

  // Stack & reach (construction lines, secondary color)
  const cons = (x1, y1, x2, y2) => el('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2),
    stroke: ACC2, 'stroke-width': 2, 'stroke-dasharray': '7 5', opacity: 0.85 });
  cons(0, 0, 0, P.htTop.y);
  cons(0, P.htTop.y, P.htTop.x, P.htTop.y);
  el('text', { x: X(P.htTop.x / 2), y: Y(P.htTop.y) - 8, fill: ACC2,
    'font-size': 24, 'text-anchor': 'middle' }).textContent = `reach ${fmtVal(state.frame.reach)}`;
  const sx = X(0) - 12, sy = Y(P.htTop.y * 0.45);
  el('text', { x: sx, y: sy, fill: ACC2, 'font-size': 24, 'text-anchor': 'middle',
    transform: `rotate(-90 ${sx} ${sy})` }).textContent = `stack ${fmtVal(state.frame.stack)}`;

  // Saddle height marker
  el('text', { x: X(P.saddleTop.x), y: Y(P.saddleTop.y) - 22, fill: MUTED,
    'font-size': 22, 'text-anchor': 'middle' })
    .textContent = `saddle ${fmtVal(D.saddleHeightAboveGround)} above ground`;
}

// ---------------------------------------------------------------------------
function update() {
  const bike = computeBike(state.frame, state.components);
  render(bike);
  renderResults(bike.derived, bike.warnings);
}

buildInputs();
loadPreset(Object.keys(PRESETS)[0]);

// Re-render on theme change so SVG picks up new palette values.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', update);
