# Bike Fit Calculator

Enter the numbers from a manufacturer's geometry chart plus your component choices, and
see the whole bike drawn to scale with its overall dimensions — total length, total
height, wheelbase, trail, standover, saddle and handlebar positions — all derived live.

**Live app:** https://evanbell.site/bike_fit/ (GitHub Pages)

No build step, no dependencies: plain HTML + ES modules + SVG. Open `index.html` from any
static server (`npx http-server`, `python -m http.server`, …).

## What you enter

**Frame chart** (the numbers brands publish): stack, reach, head tube angle, seat tube
angle, head tube length, chainstay, BB drop, fork offset (rake), seat tube length, and
optionally the chart's wheelbase — used only as a cross-check against the derived value.

**Components:** wheel size + tire width, stem length/angle, spacers, headset top cap, bar
reach/drop (drop bars) or rise (flat bars), saddle height/setback, crank length.

## What it computes

- **Overall length & height** of the assembled bike (tire tips, saddle tail, bar extents)
- **Wheelbase** (derived from the steering-axis construction; warns if it disagrees with
  the chart by more than 8 mm), front center, rear center
- **Trail** — `(R·cos(HTA) − rake)/sin(HTA)` — and BB height above ground
- **Fit coordinates:** handlebar X/Y from the BB (the HX/HY convention bike fitters use),
  saddle–bar drop and reach, saddle and bar heights above ground
- Effective top tube, approximate standover, pedal ground clearance, wheel outer diameter

Everything updates as you type, drawn on an annotated SVG side view. Units toggle
between mm and inches.

## How the math works

The model is a bottom-bracket-origin coordinate system (+x forward, +y up):

1. Stack/reach place the top of the head tube; the head tube angle defines the steering axis.
2. The front axle is found by offsetting the steering axis forward by the fork offset
   (perpendicular to the axis, per the correct definition of rake) and intersecting with
   the axle line at BB-drop height — so wheelbase is *derived*, not trusted.
3. Cockpit: headset cap + spacers + half the stem clamp project **along the steering
   axis** (spacers move the bar up *and* back); the stem extends at
   `(90° − head angle) + stem angle` from horizontal. This matches the math verified in
   two production fit calculators (XY Bike Calc, bike_stem_calculator).
4. The saddle sits along the seat tube angle at your saddle height, minus setback.
5. Tire radius (bead seat/2 + tire width) converts frame-space to ground-referenced
   heights — BB *drop* is frame-fixed, BB *height* depends on your tires.

Full sourcing and verification notes: [RESEARCH.md](RESEARCH.md). Core math:
[js/geometry.js](js/geometry.js) (pure functions, unit-testable in Node).

## Adding your own bike

Copy any entry in [js/presets.js](js/presets.js) and fill in your bike's chart numbers —
or paste a geometry chart into Claude and ask it to add the preset for you.

## Caveats

- Standover uses a horizontal-top-tube approximation (there is no industry standard for
  where standover is measured on sloping top tubes).
- Seat tube length is drawing-only; brands measure it four different ways, so it is kept
  out of the fit math.
- Mixed wheel sizes (mullet setups) are not yet modeled.

🤖 Built with [Claude Code](https://claude.com/claude-code)
