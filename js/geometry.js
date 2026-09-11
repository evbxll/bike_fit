/*
 * geometry.js — pure math for deriving a complete bike from a manufacturer
 * geometry chart plus component choices.
 *
 * Coordinate system: bottom bracket (BB) at origin, +x toward the front
 * wheel, +y up. All lengths in mm, all angles in degrees as published
 * (head/seat angle measured from horizontal).
 */

const DEG = Math.PI / 180;

/** Wheel: ISO bead seat diameter (mm) by common wheel-size name. */
export const BEAD_SEAT = {
  '700c / 29"': 622,
  '650b / 27.5"': 584,
  '26"': 559,
  '24"': 507,
  '20" (BMX/folding)': 406,
};

/** Outer wheel radius from bead seat diameter and tire width (both mm). */
export function wheelRadius(beadSeatDia, tireWidth) {
  return beadSeatDia / 2 + tireWidth;
}

/**
 * Compute the full bike from inputs.
 *
 * frame: { stack, reach, headAngle, seatAngle, headTubeLength,
 *          chainstay, bbDrop, forkOffset, seatTubeLength,
 *          wheelbase? (optional, published — used for cross-check) }
 * components: { beadSeat, tireWidth, spacers, headsetTopCap, stemLength,
 *               stemAngle, barReach, barRise, saddleHeight, saddleSetback,
 *               saddleLength, crankLength }
 *
 * Returns { points, derived, warnings } where points are {x,y} in BB space.
 */
export function computeBike(frame, components) {
  const f = frame, c = components;
  const warnings = [];

  const ha = f.headAngle * DEG;
  const sa = f.seatAngle * DEG;
  const Rw = wheelRadius(c.beadSeat, c.tireWidth);

  // --- Axles ---------------------------------------------------------------
  // BB sits bbDrop below the axle line, so both axles are at y = +bbDrop.
  const axleY = f.bbDrop;
  if (f.chainstay <= Math.abs(f.bbDrop)) {
    warnings.push('Chainstay must be longer than BB drop.');
  }
  const rearAxle = {
    x: -Math.sqrt(Math.max(1, f.chainstay ** 2 - f.bbDrop ** 2)),
    y: axleY,
  };

  // --- Head tube & steering axis -------------------------------------------
  // Stack/reach locate the TOP-CENTER of the head tube relative to the BB.
  const htTop = { x: f.reach, y: f.stack };
  // Unit vector pointing DOWN along the steering axis.
  const down = { x: Math.cos(ha), y: -Math.sin(ha) };
  // Unit vector perpendicular to the steering axis, pointing forward.
  const perp = { x: Math.sin(ha), y: Math.cos(ha) };
  const htBottom = {
    x: htTop.x + down.x * f.headTubeLength,
    y: htTop.y + down.y * f.headTubeLength,
  };

  // --- Front axle ----------------------------------------------------------
  // The axle lies on a line parallel to the steering axis, offset forward by
  // the fork offset (rake). Intersect that line with the axle height
  // (y = bbDrop) so both wheels sit on the ground.
  // P(t) = htTop + offset*perp + t*down ;  solve P(t).y = axleY
  const t = (htTop.y + f.forkOffset * perp.y - axleY) / Math.sin(ha);
  const frontAxle = {
    x: htTop.x + f.forkOffset * perp.x + t * down.x,
    y: axleY,
  };

  const wheelbase = frontAxle.x - rearAxle.x;
  if (f.wheelbase && Math.abs(f.wheelbase - wheelbase) > 8) {
    warnings.push(
      `Derived wheelbase (${wheelbase.toFixed(0)} mm) differs from the published ` +
      `figure (${f.wheelbase} mm) by more than 8 mm — double-check head angle, ` +
      `fork offset, stack/reach or tire size.`
    );
  }

  // --- Ground & trail ------------------------------------------------------
  const groundY = axleY - Rw;
  const bbHeightAboveGround = -groundY; // BB is at y=0
  // Ground trail: contact patch trails the steering-axis ground intercept.
  const trail = (Rw * Math.cos(ha) - f.forkOffset) / Math.sin(ha);
  const mechanicalTrail = trail * Math.sin(ha);

  // --- Saddle --------------------------------------------------------------
  // Saddle height measured BB-center to saddle top along the seat tube line.
  const seatUp = { x: -Math.cos(sa), y: Math.sin(sa) };
  const saddleTop = {
    x: seatUp.x * c.saddleHeight - c.saddleSetback,
    y: seatUp.y * c.saddleHeight,
  };
  const seatTubeTop = {
    x: seatUp.x * f.seatTubeLength,
    y: seatUp.y * f.seatTubeLength,
  };

  // --- Stem & handlebar ----------------------------------------------------
  // Stem clamp sits above the head tube top: headset top cap + spacers +
  // half the stem clamp height, measured along the steering axis.
  const up = { x: -down.x, y: -down.y };
  const clampRise = c.headsetTopCap + c.spacers + (c.stemClampHeight ?? 40) / 2;
  const stemClamp = {
    x: htTop.x + up.x * clampRise,
    y: htTop.y + up.y * clampRise,
  };
  // Stem extension angle from horizontal: a -17 deg stem is level on a
  // 73 deg head tube  =>  angle = (90 - headAngle) + stemAngle.
  const stemDir = (90 - f.headAngle + c.stemAngle) * DEG;
  const barClamp = {
    x: stemClamp.x + Math.cos(stemDir) * c.stemLength,
    y: stemClamp.y + Math.sin(stemDir) * c.stemLength,
  };
  // Hand positions, following the standard fit convention (BB-origin):
  // Handlebar X/Y = bar center at the stem clamp; Effective Bar Y adds bar
  // rise; drops = (HX + bar reach, Effective Bar Y - bar drop).
  const effectiveBarY = barClamp.y + c.barRise;
  const gripCenter = {
    x: barClamp.x + c.barReach,
    y: effectiveBarY,
  };
  const drops = {
    x: barClamp.x + c.barReach,
    y: effectiveBarY - (c.barDrop ?? 0),
  };

  // --- Fit metrics ---------------------------------------------------------
  const saddleBarDrop = saddleTop.y - barClamp.y;
  const saddleBarReach = barClamp.x - saddleTop.x;
  const frontCenter = Math.hypot(frontAxle.x, frontAxle.y);
  const rearCenter = f.chainstay;

  // --- Effective top tube (horizontal from HT top to seat tube line) -------
  // Intersect the horizontal line at htTop.y with the seat tube axis.
  const seatXAtHtTop = seatUp.x * (htTop.y / seatUp.y);
  const effectiveTopTube = htTop.x - seatXAtHtTop;

  // --- Standover (approximate: horizontal top tube at stack height) --------
  const standover = htTop.y - groundY;

  // --- Overall envelope ----------------------------------------------------
  const rearTireBack = rearAxle.x - Rw;
  const frontTireFront = frontAxle.x + Rw;
  const saddleBack = saddleTop.x - (c.saddleLength ?? 270) / 2;
  const minX = Math.min(rearTireBack, saddleBack);
  const maxX = Math.max(frontTireFront, gripCenter.x);
  const overallLength = maxX - minX;

  const topCandidates = [
    saddleTop.y + 40,            // saddle body sits ~40 mm above rail line
    barClamp.y + 20,             // bar tube above clamp center
    gripCenter.y + 20,
    axleY + Rw,                  // wheel tops
  ];
  const overallHeight = Math.max(...topCandidates) - groundY;

  const crankLow = -(c.crankLength ?? 172.5); // pedal spindle at 6 o'clock
  const pedalGroundClearance = crankLow - groundY;

  return {
    points: {
      bb: { x: 0, y: 0 },
      rearAxle, frontAxle, htTop, htBottom, stemClamp, barClamp,
      gripCenter, drops, saddleTop, seatTubeTop,
      groundY,
    },
    derived: {
      wheelRadius: Rw,
      wheelDiameter: Rw * 2,
      wheelbase,
      frontCenter,
      rearCenter,
      trail,
      mechanicalTrail,
      bbHeightAboveGround,
      effectiveTopTube,
      standover,
      overallLength,
      overallHeight,
      handlebarX: barClamp.x,
      handlebarY: barClamp.y,
      saddleBarDrop,
      saddleBarReach,
      saddleTipToBar: saddleBarReach - (c.saddleLength ?? 270) / 2,
      pedalGroundClearance,
      saddleHeightAboveGround: saddleTop.y - groundY,
      barHeightAboveGround: barClamp.y - groundY,
    },
    warnings,
  };
}

export const MM_PER_INCH = 25.4;
export function fmt(mm, units) {
  return units === 'in'
    ? (mm / MM_PER_INCH).toFixed(1) + ' in'
    : Math.round(mm) + ' mm';
}
