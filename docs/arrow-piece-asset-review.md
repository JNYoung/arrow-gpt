# Arrow Piece Asset Review

Date: 2026-05-30

## Competitor Takeaways

- Tap Away 3D frames the core fantasy as tapping blocks so they fly away in one direction; the App Store listing emphasizes block-clearing and one-way movement. This supports a tactile block-first asset, not a thin line icon. Source: https://apps.apple.com/us/app/tap-away-3d/id1568058543
- Arrows Jam's Google Play copy stresses multiple arrows, a special golden target arrow, lives, hints, shuffle, and smooth move/collision effects. This supports high-contrast direction readability and a visibly premium movable piece. Source: https://play.google.com/store/apps/details?id=com.hipahipagames.pj000093
- Tap Away style competitors on Google Play repeatedly describe cubes/blocks with arrows and relaxation/satisfaction. The common pattern is chunky, colorful, obvious tap targets. Source: https://play.google.com/store/apps/details?hl=en_US&id=com.enjoybit.tapaway

## Generated Concept Sheets

- `docs/assets/arrow-piece-concept-sheet-v1.png`
- `docs/assets/arrow-piece-concept-sheet-v2.png`

## Judgment

### V1

- Row 1 has the best immediate readability: large arrow, clear bevel, strong toy-block signal.
- Row 2 is too watery. Bubbles and translucent texture will become visual noise at mobile tile size.
- Row 3 feels premium, but the metallic/gold rim is too heavy for the current frosted maze board and could compete with exit gates.

### V2

- Row 1 is the strongest direction for production: glossy but not over-rendered, large arrow, white outer bevel that separates the tile from the route layer.
- Row 2 is readable but a little too flat; useful as a fallback for low-end performance or if screenshots feel too glossy.
- The best implementation target is a hybrid of V2 row 1 with slightly reduced contact shadow and no per-frame bitmap rotation artifacts.

## Recommended Asset Spec

- Tile shape: rounded square, radius about 18%-22% of size.
- Material: glossy toy-plastic / enamel, not jelly, not metal.
- Arrow: white inset arrow, very thick silhouette, about 58%-66% of tile width.
- Edge: light off-white bevel plus darker inner groove, so the tile stays readable over pale tracks.
- Colors: blue/up, green/right, yellow/down, coral-red/left. Available state can still use a yellow/gold highlight, but direction color should remain visible through rim, glow, or base tint.
- Shadows: one soft contact shadow and one inner edge shadow. Avoid large floor shadows because pieces sit inside the board plane.

## Next Step

Generate or cut a 4-direction transparent PNG sprite set from V2 row 1, then compare in-game at 48px, 64px, and current board tile size before replacing the SVG piece.
