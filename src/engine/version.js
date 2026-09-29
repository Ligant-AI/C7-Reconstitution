// Engine version (C7-NF-09), the tool-set rule in three categories, as C1, C3
// and C4:
//
//   MAJOR  when any reported number changes at any input, or any input moves
//          between computed and rejected.
//   MINOR  when the result object changes and no number does.
//   PATCH  when neither the object nor any number changes.
//
// 0.1.0 (28 September 2026): first build against URS v1.0. Pre-release: the
// tolerances of outstanding item 3 are open and the C7-FL-08 threshold value is
// a provisional placeholder (outstanding item 1), so no 1.0.0 is claimed.
// 0.1.1 (29 September 2026), PATCH: page text and a dependency only. The suite
// footer (@ligant/bench-chrome 1.1.0) asks before Google Analytics loads, and the
// CSP allows the Google hosts it needs. No number and no object changes.
export const ENGINE_VERSION = '0.1.1';
export const URS_VERSION = '1.0';
export const TOOL_ID = 'C7';
export const TOOL_NAME = 'Reconstitution';
