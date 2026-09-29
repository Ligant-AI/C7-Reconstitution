// Generates REAL C1 structured result objects by calling C1's own compute + serialise
// (C1 commit cc60a5c, src/lib/serialise.ts 1875c9f). Bundled with C1's esbuild; nothing written into C1.
import { computeConversion } from '../../../C1-Molarity_Converter/Ligant.ai-Molarity-Converter/src/lib/compute.ts';
import { toStructuredResult, validateStructuredResult } from '../../../C1-Molarity_Converter/Ligant.ai-Molarity-Converter/src/lib/serialise.ts';
export function realC1(massBasis, { mw = 148.3, mwUnit = 'kDa', provenance = 'certificate-of-analysis' } = {}) {
  const out = computeConversion({ direction: 'mass-to-molar', enteredValue: 1, mwValue: mw, provenance, massBasis, units: { mass: 'mg/mL', molar: 'uM', mw: mwUnit } });
  if (!out.ok) throw new Error(JSON.stringify(out.rejections));
  const obj = toStructuredResult(out);
  return { obj, problems: validateStructuredResult(obj) };
}
