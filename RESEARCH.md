# Research: how bike geometry is measured, published, and computed

Findings from a multi-agent deep-research pass (2026-09-10): 5 parallel search angles,
15 fetched sources, 25 extracted claims each adversarially verified by 3 independent
voters (2/3 refutations kill a claim). Result: **24 claims confirmed, 1 refuted.**
These findings drive the design of the calculator in this repo.

## Confirmed findings (high confidence unless noted)

### 1. Stack & reach are the modern cross-brand sizing pair
Vertical and horizontal distances from the **bottom bracket center to the top-center of
the head tube**. They replaced top tube / head tube length as the primary sizing numbers
and are usually published correctly when present. They are dominant but not sufficient —
seat and head tube angles are still needed for a full picture.
Sources: [99spokes](https://99spokes.com/bicycle-geometry-terms),
[BikeRadar](https://www.bikeradar.com/advice/sizing-and-fit/road-bike-geometry-explained),
[BikeGeoCalc](https://www.bikegeocalc.com/). Votes: 3-0, 3-0, 3-0.

**→ In this app:** stack/reach are the anchor inputs; everything else hangs off them in a
BB-origin coordinate system.

### 2. Manufacturer geometry charts are the standard data source — but conventions vary
Per-model tables list tube lengths and angles (seat tube, top tube, head/seat angles,
head tube length, chainstay, wheelbase, BB drop, stack, reach…). Aggregators
(99spokes, Geometry Geeks, Bike Insights) are built directly on these charts. However,
**seat tube length alone has four different measurement conventions** (top of seat tube,
center-to-top, center-to-center, effective) — software must tolerate per-brand ambiguity.
Votes: 3-0, 3-0.

**→ In this app:** seat tube length is used only for drawing the frame silhouette, never
for fit math, so chart-convention differences can't corrupt the derived dimensions.
Published wheelbase is treated as a cross-check, not an input.

### 3. Trail is derived, not measured
`trail = (R·cos(HTA) − rake) / sin(HTA)` with R = wheel outer radius, HTA measured from
horizontal. Even when a chart prints trail, it was calculated from these three inputs.
The steering axis is the head tube centerline.
Sources: 99spokes, [Sheldon Brown](https://sheldonbrown.com/gloss_st-z.html),
[Wikipedia](https://en.wikipedia.org/wiki/Bicycle_and_motorcycle_geometry). Votes: 3-0, 3-0.

**→ In this app:** exactly this formula ([geometry.js](js/geometry.js)); road preset yields
~57 mm, matching category norms.

### 4. BB drop is frame-fixed; BB height depends on components
BB **drop** (BB center below the axle line) is a frame constant. BB **height**
(BB center to ground) varies with wheel/tire choice. Ground-referenced overall
dimensions therefore depend on components, not frame geometry alone.
Votes: 3-0, 3-0. Caveat: mixed wheel sizes ("mullet" setups) tilt the axle line, an edge
case the sources don't fully resolve (not yet modeled here).

**→ In this app:** BB drop is a frame input; BB height, overall height, saddle/bar heights
above ground are all derived after tire radius is known.

### 5. Handlebar position math (verified against two production codebases)
Fit handlebar X/Y from stack/reach + components, confirmed identical in
[XY Bike Calc](https://www.xybikecalc.com/) and
[bike_stem_calculator](https://github.com/rswerve/bike_stem_calculator):
- Headset cap + spacers + **half the stem clamp height** are projected **along the steering
  axis**: rise = h·sin(HTA), rearward run = h·cos(HTA) — adding spacers moves the bar up *and back*.
- Installed stem angle from horizontal = (90° − HTA) + nominal stem angle;
  stem rise = L·sin(θ), run = L·cos(θ).
- Bar position = (reach − spacerRun + stemRun, stack + spacerRise + stemRise).
Votes: 3-0 ×4.

**→ In this app:** same math, same half-clamp-height convention.

### 6. Fit coordinates are BB-origin and invertible
Handlebar X/Y (BB → bar center at stem clamp), Effective Bar Y = HY + bar rise,
drops = (HX + bar reach, Effective Bar Y − bar drop); saddle X/Y from BB to saddle rail
center. Frame stack/reach ↔ fit HX/HY are mutually convertible given the cockpit setup,
which is how "bike prescriber" tools search databases for a target position.
Sources: XY Bike Calc, [Velogic Fit docs](https://docs.velogicfit.com/general/bar-xy-coordinates). Votes: 3-0 ×4.

**→ In this app:** HX/HY and drops are computed with these exact conventions and shown in
the results panel.

### 7. Established tools separate frame layer from component layer
BikeCAD's Dimensions dialog has a Frame tab covering "the bulk of dimensions presented in
manufacturers frame specification charts," with saddle/bar positions living under
Components; BikeGeoCalc models stem/bar/crank/seatpost/wheel separately from the frame.
rattleCAD (medium confidence, 2-1 + 3-0) uses the same architecture: parametric geometry
core + swappable components + rendered drawing.
Sources: [BikeCAD](https://www.bikecad.ca/dimensions_dialog), BikeGeoCalc,
[rattleCAD](https://sourceforge.net/projects/rattlecad/).

**→ In this app:** `frame` and `components` are separate objects end to end (inputs,
presets, `computeBike(frame, components)`).

### 8. Geometry can be reconstructed from XY measurements of a physical bike
With the bike upright against a wall, floor + wall serve as perpendicular reference
planes; BikeGeoCalc derives angles, stack/reach, and trail from measured XY points.
Vote: 3-0. (A candidate future input mode for bikes with no published chart.)

### 9. Standover (medium confidence, 2-1)
Height of the top tube above the ground; traditionally a prime dimension, but there is
**no industry standard** for where along a sloping top tube it's measured, and modern fit
sources rank it well below stack/reach.
Source: Sheldon Brown.

**→ In this app:** reported explicitly as an approximation (horizontal top tube at stack height).

## Refuted claim (do not rely on)

> "Fork rake is the *horizontal* distance from the projected steering axis to the front
> axle…" — **refuted 1-2.** The correct definition is the **perpendicular** distance from
> the steering axis to the front axle center. (The directional rake→trail relationship —
> more rake, less trail — was itself confirmed by the voters; the definition was the error.)

**→ In this app:** fork offset is applied perpendicular to the steering axis, per the
correct definition.

## Open questions from the research
- No standard machine-readable schema exists for manufacturer geometry charts; software
  normalizes inconsistent per-brand tables itself.
- Handlebar shape beyond scalar reach/drop/rise (flare, hood position) is excluded or
  scalar-reduced in all surveyed tools; this app follows the scalar convention.
- No source directly covered overall bounding length/height conventions (e.g. for van or
  travel-case fit) — this app derives them from the geometric envelope: tire tips, saddle
  tail, and bar extents.
