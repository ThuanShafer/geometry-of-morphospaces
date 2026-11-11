# Every shell is the same shell

An interactive morphospace of the coiled shell. One tube grows only at its mouth. Three numbers — whorl expansion **W**, distance from the coiling axis **D**, and translation along that axis **T** — decide the form. Move a point through the cube, or drag the sliders, and the same tube becomes a turret, a snail, a nautilus, a clam valve, or a region where nothing lives.

The generating curve is held to a circle. Spines, ears, flutes, pearls, an operculum, and byssus threads are outside the model. Color and sculpture are painted onto the tube once a named form is reached. They are not grown by W, D, and T.

## What the shell is

A molluscan shell is built by accretion. The mantle adds calcium carbonate only at the aperture, so the animal never molts and the early shell stays at the apex. If the aperture enlarges by a constant factor each revolution, the coil is a logarithmic spiral: the shape is the same at every size. That is the growth David Raup put into three (originally four) parameters.

In the form used here, following Noshita (2014) and the [ktch](https://github.com/noshita/ktch) implementation, θ = 0 at the aperture and decreases toward the apex:

```text
r(θ) = W^(θ / 2π)
R    = r · (1 + D) / (1 − D)
Z    = r · 2T / (1 − D)
```

`r` is the size of the aperture. `R` is how far the tube center sits from the coiling axis. `Z` is its height along that axis. A circular section of radius `r` is swept along this path. The mesh is that sweep: an outer surface, an inner surface, a lip at the mouth, and a cap at the apex.

| Parameter | Range in the cube | What it does |
| --- | --- | --- |
| **W**, whorl expansion | about 1.12 to 10⁶, on a log axis | How much the tube widens in one full turn. Near 1, many tight turns. Very large, the flare finishes in less than a turn. |
| **D**, distance from the axis | 0 to 0.88 | `D = r_inner / r_outer`. At 0 the inner margin touches the axis. Toward 1 the turns leave a hole, the umbilicus. |
| **T**, translation | 0 to 6 | Movement along the axis per turn, in the same units as the aperture. At 0 the coil is planispiral. Larger values drop each turn and build a tower. |

Raup’s fourth parameter, **S**, is the shape of the generating curve. It is fixed at 1, a circle, so every form in this cube shares one aperture. A real shell’s oval mouth, sinus, or siphonal canal is not in these three numbers.

The cube is not a space of equal biological steps. **W** is logarithmic; **D** and **T** are linear. Distance between two points is a coordinate distance, not a measure of relatedness or of functional difference (Gerber 2017).

### Where familiar forms sit

- **Towers** (low W, high T). Turret shells, augers, and pond snails. Each turn is only a little wider than the last, and translation stacks them into a spire. The suture is the seam where one whorl meets the next.
- **Globose snails** (moderate W and T). A Roman snail or a garden snail. Less translation than a tower, so the whorls pile into a ball. The last turn is the body whorl. The animal lives in it.
- **Planispiral coils** (T near 0). *Nautilus*, ammonites, and ramshorn snails. *Nautilus* is fixed at a threefold expansion, W = 3. Older chambers can be emptied through the siphuncle; the app marks the living chamber, the periphery, and the aperture, and does not draw the septa.
- **Open coils** (higher D). Wentletraps, *Spirula*, and the paper nautilus leave space between turns. *Spirula* carries its gas-filled coil inside the body. *Argonauta* is a case shaped by two webbed arms, not a mantle-secreted shell.
- **Valves** (very high W). A clam, oyster, mussel, or scallop is the same tube flared so fast that it is a curved sheet rather than a spiral of many turns. When that form is named, a second copy is hinged at the beak and swung open. Ribs, flutes, hinge ears, and the long siphon of a geoduck are not part of the coil. A shipworm is this valve reduced to a small drill on a worm-shaped body.
- **Other tubes that pass through the same geometry.** A tusk shell is almost a straight, slowly widening cone. A ram’s horn is keratin over bone, grown from the base. An elephant tusk is dentine, an ever-growing incisor. A hermit crab grows no spiral; it occupies an empty snail shell of about that shape. *Spirorbis* is a serpulid worm tube. *Elphidium* is a one-celled foraminiferan, and the coil is its test.

Labels on the mesh (apex, spire, suture, body whorl, aperture, outer lip, umbilicus, periphery, living chamber) follow the coil. Which of them appear depends on the plan: a tower is not labeled like a valve, and a horn is marked at tip and base.

Empty regions of the cube are labeled unoccupied: nothing alive and nothing fossil at those coordinates. The reading given in the interface is Raup’s and Gould’s. Raup treated much of the empty volume as geometrically awkward or biologically costly. Gould treated it as history: life never arrived there.

### What is and is not a measurement

Sixty-one named forms are placed in the regions of Raup’s 1966 cube and spaced so each one locks to its own point. The coordinates are reconstructions, not caliper measurements of specimens. Landing inside a small tolerance of a point reveals the binomial, a one-line account of the geometry, a natural-history note, and a link to the species on [iNaturalist](https://www.inaturalist.org/). Found names are kept in the browser (`localStorage`).

Most entries are living molluscs (gastropods, bivalves, cephalopods, one scaphopod). Two Early Jurassic ammonites are marked extinct. Six occupants are marked as not a shell: the hermit crab, the worm tube, the foraminiferan, the argonaut’s case, the horn, and the tusk.

## Research background

Theoretical morphology asks which forms a growth rule can produce, and then which of those forms organisms actually occupy. For coiled shells the modern version of that question starts with two papers:

- Raup, D. M. & Michelson, A. 1965. Theoretical morphology of the coiled shell. *Science* 147:1294–1295. [doi:10.1126/science.147.3663.1294](https://doi.org/10.1126/science.147.3663.1294)
- Raup, D. M. 1966. Geometric analysis of shell coiling: general problems. *Journal of Paleontology* 40:1178–1190. [JSTOR](https://www.jstor.org/stable/1301992)

Raup generated shells by revolving an expanding generating curve about an axis and translating it along that axis. Plotting W, D, and T filled a cube. Snails, cephalopods, and bivalves fell in different regions. Large volumes stayed empty, which he read as impossible geometries or forms too expensive to build. Later work, including Gould’s, split that claim: some absence is constraint, and some is contingency — a region the genealogy of life simply did not enter. The empty-state line in the app is that distinction, stated in one sentence.

The computer graphics of the coil follow the parameterization used by Noshita (2014) and in [ktch](https://github.com/noshita/ktch). This project does not call that library. It evaluates the same frame in the browser and builds the triangle mesh directly.

A warning on reading the picture, cited in the interface: the axes are not commensurate, so a step in the cube is not a biological distance.

- Gerber, S. 2017. The geometry of morphospaces: lessons from the classic Raup shell coiling model. *Biological Reviews* 92:1142–1155. [doi:10.1111/brv.12276](https://doi.org/10.1111/brv.12276)

## Technologies

The app is a client-side React application. There is no server and no shell-geometry library at runtime.

- [Vite](https://vite.dev/) builds and serves the app.
- [React 19](https://react.dev/) and TypeScript hold the parameters, the specimen lock, and the panel.
- [Three.js](https://threejs.org/) stores the shell mesh. [@react-three/fiber](https://r3f.docs.pmnd.rs/) and [@react-three/drei](https://github.com/pmndrs/drei) draw the shell, the morphospace cube, orbit controls, and lighting.
- The coil, the anatomy marks, the bivalve hinge, the specimen table, and the color patterns are plain TypeScript in `src/model` and `src/components`.
- [Vitest](https://vitest.dev/) tests the frame, the cube mapping, and specimen matching.
- [Oxlint](https://oxc.rs/) lints the source.

Species pages are ordinary links to iNaturalist. Nothing is fetched from that site at runtime.

## Run it

Use Node.js 20.19 or newer (Node 22 works).

```bash
npm install
npm run dev
```

Vite prints a local URL, usually `http://localhost:5173`. Drag the shell to turn it. Drag the point in the cube, or use the W, D, and T sliders. Hover or tap the shell for part labels. On a phone, pinch to zoom.

Other scripts:

```bash
npm run build     # typecheck and write dist/
npm run preview   # serve the production build
npm test          # Vitest
npm run lint      # Oxlint
```
