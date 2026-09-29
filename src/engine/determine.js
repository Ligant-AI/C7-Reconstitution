// The determination (URS §5), its rejections (§7) and flags (§8), producing the
// structured result object (§13). The page, the notebook copy and the handoff
// envelope are all rendered from the object this returns, so they cannot
// disagree (C7-OUT-05).
//
// ORDER OF OPERATIONS, fixed, and mirrored in reimpl/reconstitution.py:
//   content   = toBase(entered content)                 mg, or IU / U
//   solids_g  = toGrams(total solids) | toGrams(content) for total vial contents
//   D         = solids_g × v̄                            mL, where solids known
//   Dmin      = toGrams(content) × v̄                   mass, reagent alone, no solids
//   Dapp      = D | Dmin | 0
//   target direction: F = content ÷ target; Vd = F − Dapp; Vd′ = round3(Vd)
//   final entered:    F = entered;          Vd = F − Dapp; Vd′ = round3(Vd)
//   diluent entered:  Vd′ = entered;        F = Vd′ + Dapp
//   Fa = Vd′ + Dapp  (Dapp unrounded); Ca = content ÷ Fa
// The diluent volume is ALWAYS rounded from its own unrounded value, never
// derived from a rounded final volume (C7-IV-03). The displayed final volume
// and the reported concentration both come from the one Fa.
import * as U from './units.js';
import { parseEntered, roundDec, sig, sigDirected, pct, signedPct, signedPctUp, Dec } from './numfmt.js';
import { VBAR, MATERIAL_THRESHOLD, PRECISION, SUGGESTED_MIN_TRANSFER, TOLERANCES } from './constants.js';
import { DIRECTION, CONTENT_BASIS, PROVENANCE, CONJUGATE, CARRIER, VOLUME_BASIS, C1_MASS_BASIS, C1_MW_PROVENANCE, pairing } from './declarations.js';
import { ENGINE_VERSION, URS_VERSION, TOOL_ID, TOOL_NAME } from './version.js';
import { SCHEMA } from '../shared/result-object.js';

export const PRIVACY_SCOPE = 'Ligant Bench Tools are free and open source. Research use only, not qualified for GxP decision-making.';
export const DETERMINES_NOT_VERIFIES = 'This tool determines a volume or a concentration. It does not verify what was delivered or whether the solids dissolved.';
export const HI08_SENTENCE = 'The unattainable-volume rejection (C7-HI-08) is a sign-change guard at about 1370 mg/mL of total solids; it will not fire on any real reconstitution, and its silence is not a plausibility check.';
export const PRECISION_STATEMENT = 'Volumes are displayed to 3 significant figures and concentrations to 6; fractions and percentages to 3. Rounding is half away from zero, on the exact binary value, except for a bound: an "at most" concentration is rounded up and an "at least" final volume down, so that the figure shown is itself a bound. The final volume shown is rounded. The concentration is computed from the diluent volume as displayed and the displacement applied, not from the rounded final volume.';

const A_ADDITIVE = 'Volumes are additive: final volume = diluent volume + solids mass × v̄. The correction beats no correction for solids whose mass-weighted v̄ exceeds 0.365 mL/g — protein-, sugar- and polyol-dominated solids; for salt-dominated solids it is not guaranteed.';
const A_DMIN_POLICY = 'Where the total solids mass is not known, mass-based reagent-alone content is corrected for the reagent\'s own volume only (Dmin) and its concentration is reported as an upper bound; for activity content or content basis not recorded no correction is applied and no bound is available.';
const A_PROTEIN = 'The reagent is a protein, within the scope of v̄. Dmin is a lower bound only to within v̄\'s scope error: a reagent whose true v̄ is 0.70 mL/g displaces 0.959 × Dmin.';
const A_NO_SHRINK = 'The solids other than the reagent do not reduce the solution volume. Whether any common lyophilisation excipient has a small or negative apparent volume at the relevant concentrations is not established (outstanding item 2).';
const A_DISSOLVE = 'The solids dissolve completely into the diluent.';

const UPPER_BOUND_REASON = 'The total solids mass is not declared, so only the reagent\'s own volume (Dmin = content × v̄) has been applied as displacement; carrier and excipient displacement is not included. The concentration obtained is below the reported value by an amount that cannot be computed from the declared inputs.';
const DILUENT_DMIN_LABEL = 'corrected for the reagent\'s own volume only; carrier and excipient not included';

const q = (display, unit, unrounded) => ({ display, unit, unrounded });

/**
 * @param {object} input  the form's values, as strings (numbers also accepted)
 * @param {object} [opts] `materialThreshold` is the C7-FL-08 threshold in force,
 *   a configured value that defaults to the registered MATERIAL_THRESHOLD; it
 *   lets the citation, and the C7-FX-10 boundary fixtures, set it without an
 *   engine change. The page never passes it. `_mutate(stage, value, ctx)` is a TEST-ONLY seam for
 *   C7-IV-02: it lets the invariance tests insert a clamp, a floor or a nudge
 *   into the computation path and show that each is caught. The page never
 *   passes it.
 */
export function determine(input, opts = {}) {
  const mut = typeof opts._mutate === 'function' ? opts._mutate : (_s, v) => v;
  const threshold = typeof opts.materialThreshold === 'number' ? opts.materialThreshold : MATERIAL_THRESHOLD.value;
  const done = (status, parts) => shell(status, { ...parts, threshold });
  const incomplete = [];
  const rejections = [];
  const need = (cond, message, field) => { if (!cond) incomplete.push({ field, message }); };
  const reject = (code, message) => rejections.push({ code, message });

  // ---------- declarations ----------
  const direction = input.direction || '';
  need(direction === 'target' || direction === 'volume', 'Choose a direction: target → volumes, or volume → concentration.', 'direction');

  const content = parseEntered(input.content?.value);
  const contentUnit = U.unitInfo(input.content?.unit || '');
  need(content && !content.invalid, content?.invalid ? `The stated vial content "${content.text}" is not a number.` : 'Enter the stated vial content.', 'content');
  need(!!contentUnit, 'Select the unit of the stated vial content.', 'content-unit');
  const isMass = contentUnit?.family === U.FAMILY.MASS;
  const isActivity = contentUnit && !isMass;

  // C7-VC-03 / C7-VC-03a.
  let contentBasis = null;
  if (isActivity) contentBasis = 'reagent-activity';
  else if (isMass) {
    contentBasis = CONTENT_BASIS[input.contentBasis] && input.contentBasis !== 'reagent-activity' ? input.contentBasis : null;
    need(!!contentBasis, 'Declare what the stated content is the content of.', 'content-basis');
  }
  const provenance = PROVENANCE[input.provenance] ? input.provenance : null;
  need(!!provenance, 'Declare the source of the stated content.', 'provenance');
  let conjugate = null;
  if (isMass) {
    conjugate = CONJUGATE[input.conjugate] ? input.conjugate : null;
    need(!!conjugate, 'Declare the conjugate state of the reagent.', 'conjugate');
  }
  const carrier = CARRIER[input.carrier] ? input.carrier : null;
  need(!!carrier, 'Declare whether carrier protein is present.', 'carrier');
  need(input.wholeVial === true, 'Confirm that the whole vial is reconstituted.', 'whole-vial');
  const volumeBasis = VOLUME_BASIS[input.volumeBasis] ? input.volumeBasis : null;
  need(!!volumeBasis, 'Declare which volume is meant: diluent to add, or final volume of solution.', 'volume-basis');

  // C7-VC-06: total solids, offered where the basis is the reagent alone (mass or activity).
  const solidsOffered = contentBasis === 'reagent-alone' || contentBasis === 'reagent-activity';
  let solids = null;
  let solidsUnit = null;
  if (solidsOffered) {
    solids = parseEntered(input.totalSolids?.value);
    if (solids) {
      solidsUnit = U.unitInfo(input.totalSolids?.unit || '');
      need(!solids.invalid, `The total solids mass "${solids.text}" is not a number.`, 'solids');
      need(!!solidsUnit && solidsUnit.family === U.FAMILY.MASS, 'Select the unit of the total solids mass.', 'solids-unit');
    }
  }

  // C7-PC-01, C7-PC-02.
  const minT = parseEntered(input.minTransfer?.value);
  const minUnit = U.unitInfo(input.minTransfer?.unit || '');
  need(minT && !minT.invalid, minT?.invalid ? `The minimum transfer volume "${minT.text}" is not a number.` : 'Enter the minimum reliable transfer volume.', 'min-transfer');
  need(!!minUnit && minUnit.family === U.FAMILY.VOLUME, 'Select the unit of the minimum transfer volume.', 'min-unit');
  const minIsDefault = !!minT && !minT.invalid && minT.text === SUGGESTED_MIN_TRANSFER.value && minUnit?.symbol === SUGGESTED_MIN_TRANSFER.unit && input.minTransferTouched !== true;
  const cap = parseEntered(input.capacity?.value);
  let capUnit = null;
  if (cap) {
    capUnit = U.unitInfo(input.capacity?.unit || '');
    need(!cap.invalid, `The vial working capacity "${cap.text}" is not a number.`, 'capacity');
    need(!!capUnit && capUnit.family === U.FAMILY.VOLUME, 'Select the unit of the vial working capacity.', 'capacity-unit');
  }

  // C1 import (C7-ST-01), already checked for integrity by the importer.
  const c1 = input.c1 || null;

  // Direction-specific inputs.
  let target = null; let targetUnit = null; let entered = null; let enteredUnit = null; let reportUnit = null;
  if (direction === 'target') {
    target = parseEntered(input.target?.value);
    targetUnit = U.unitInfo(input.target?.unit || '');
    need(target && !target.invalid, target?.invalid ? `The target concentration "${target.text}" is not a number.` : 'Enter the target concentration.', 'target');
    need(!!targetUnit && U.CONCENTRATION_UNITS.includes(targetUnit), 'Select the unit of the target concentration.', 'target-unit');
  } else if (direction === 'volume') {
    entered = parseEntered(input.volume?.value);
    enteredUnit = U.unitInfo(input.volume?.unit || '');
    need(entered && !entered.invalid, entered?.invalid ? `The volume "${entered.text}" is not a number.` : 'Enter the volume.', 'volume');
    need(!!enteredUnit && enteredUnit.family === U.FAMILY.VOLUME, 'Select the unit of the volume.', 'volume-unit');
    reportUnit = U.unitInfo(input.reportUnit || '');
    need(!!reportUnit && U.CONCENTRATION_UNITS.includes(reportUnit) && reportUnit.family !== U.FAMILY.MOLAR, 'Select the unit to report the concentration in.', 'report-unit');
  }

  const molarTarget = targetUnit?.family === U.FAMILY.MOLAR;
  // The unit of the molar form, where one can be shown.
  let molarUnit = molarTarget ? targetUnit : null;
  if (!molarTarget && c1) {
    molarUnit = U.unitInfo(input.molarUnit || '');
    if (molarUnit && molarUnit.family !== U.FAMILY.MOLAR) molarUnit = null;
  }

  const declarations = buildDeclarations({ direction, content, contentUnit, contentBasis, provenance, conjugate, carrier, wholeVial: input.wholeVial === true, volumeBasis, solidsOffered, solids, solidsUnit, minT, minUnit, minIsDefault, cap, capUnit, target, targetUnit, entered, enteredUnit, reportUnit, c1 });

  if (incomplete.length) return done('incomplete', { declarations, incomplete, rejections: [], c1 });

  // ---------- rejections (§7) ----------
  const cUnit = contentUnit.symbol;
  // §7's value conditions are evaluated on the exact entered decimals, not on
  // their doubles: a positive entry beyond the double range is still positive
  // (adversarial findings F-3, F-4), and C7-HI-07 compares masses exactly.
  const positiveDec = (x) => Dec.sign(x.dec) > 0;
  const mgDec = (x, unit) => Dec.shift(x.dec, { µg: -3, mg: 0, g: 3 }[U.canonical(unit)]);
  if (!positiveDec(content)) reject('C7-HI-01', `The stated vial content is ${content.text} ${cUnit}. A vial cannot hold zero or negative content.`);
  if (direction === 'target' && !positiveDec(target)) reject('C7-HI-02', `The target concentration is ${target.text} ${targetUnit.symbol}. A concentration cannot be zero or negative.`);
  if (direction === 'volume' && !positiveDec(entered)) reject('C7-HI-02', `The entered ${VOLUME_BASIS[volumeBasis]} is ${entered.text} ${enteredUnit.symbol}. A volume cannot be zero or negative.`);
  if (cap && !positiveDec(cap)) reject('C7-HI-02', `The declared vial working capacity is ${cap.text} ${capUnit.symbol}. A volume cannot be zero or negative.`);
  if (!positiveDec(minT)) reject('C7-HI-06', `The declared minimum transfer volume is ${minT.text} ${minUnit.symbol}. A volume cannot be zero or negative.`);

  // Dimension of the concentration against the content (C7-TG-02).
  const concUnit = direction === 'target' ? targetUnit : reportUnit;
  if (concUnit.family !== U.FAMILY.MOLAR) {
    const wanted = U.concFamilyForContent(contentUnit.family);
    if (concUnit.family !== wanted) {
      const contentAct = U.isActivityFamily(contentUnit.family);
      const concAct = U.isActivityFamily(concUnit.family);
      const role = direction === 'target' ? 'target concentration' : 'concentration unit';
      if (contentAct && concAct) {
        reject('C7-HI-09', `The content is in ${cUnit} and the ${role} is in ${concUnit.symbol}. IU is referenced to an international standard while U is assay- and lot-defined; they are not interconvertible without the lot's definition, which this tool does not hold.`);
      } else {
        reject('C7-HI-03', `The content is in ${cUnit} and the ${role} is in ${concUnit.symbol}. Converting between mass and activity requires a lot-specific specific activity, which this tool does not hold.`);
      }
    }
  }

  // Molar target (C7-TG-03, C7-HI-04).
  let pair = null;
  if (c1 && isMass) pair = pairing({ c1Basis: c1.massBasis, c7Basis: contentBasis, conjugate });
  if (molarTarget) {
    if (isActivity) {
      const p = pairing({ c1Basis: c1?.massBasis || 'not-recorded', c7Basis: 'reagent-activity', conjugate: null });
      reject('C7-HI-04', `The target is ${target.text} ${targetUnit.symbol}, a molar concentration, and the content is ${content.text} ${cUnit}. ${p.reason}. A molar target requires a molecular weight imported from C1 and a mass-based content.`);
    } else if (!c1) {
      reject('C7-HI-04', `The target is ${target.text} ${targetUnit.symbol}, a molar concentration, and no molecular weight has been imported. A molar target requires a molecular weight imported from C1 and a mass-based content.`);
    } else if (!pair.permitted) {
      reject('C7-HI-04', `The target is ${target.text} ${targetUnit.symbol}, a molar concentration. Declared bases: molecular weight — ${pair.bases.c1MassBasis}; content — ${pair.bases.contentBasis}; conjugate — ${pair.bases.conjugate}. ${pair.reason} (§8 pairing table, row ${pair.row}).`);
    }
  }

  // Total solids against content (C7-HI-07).
  if (solids && contentBasis === 'reagent-alone') {
    if (Dec.cmp(mgDec(solids, solidsUnit.symbol), mgDec(content, cUnit)) < 0) reject('C7-HI-07', `The declared total solids mass is ${solids.text} ${solidsUnit.symbol} and the stated reagent content is ${content.text} ${cUnit}. Total solids cannot be less than the reagent they contain.`);
  }

  // §7 table order, whatever order the conditions were evaluated in (adversarial finding F-2).
  const hiOrder = (x) => Number(x.code.slice(-2));
  rejections.sort((a, b) => hiOrder(a) - hiOrder(b));
  if (rejections.length) return done('rejected', { declarations, incomplete: [], rejections, c1 });
  {
    const entries = [[content, 'the stated vial content'], [solids, 'the total solids mass'], [minT, 'the minimum transfer volume'], [cap, 'the vial working capacity'], [target, 'the target concentration'], [entered, 'the entered volume']];
    const bad = entries.find(([x]) => x && x.unrepresentable);
    if (bad) return unrepresentable(declarations, c1, threshold, `${bad[1]} as entered, ${bad[0].text}`);
  }

  // ---------- the determination (§5) ----------
  const contentBase = mut('content', U.toBase(mut('contentRaw', content.value, { unit: cUnit }), cUnit), { unit: cUnit });
  let solidsG = null; let solidsSource = null;
  if (contentBasis === 'total-vial-contents') { solidsG = U.toGrams(content.value, cUnit); solidsSource = 'the stated content (total vial contents)'; }
  else if (solids) { solidsG = U.toGrams(solids.value, solidsUnit.symbol); solidsSource = 'the declared total solids mass'; }
  const D = solidsG !== null ? solidsG * VBAR.value : null;
  const Dmin = D === null && contentBasis === 'reagent-alone' ? U.toGrams(content.value, cUnit) * VBAR.value : null;
  const Dapp = D !== null ? D : Dmin !== null ? Dmin : 0;
  const treatment = D !== null ? 'computed' : Dmin !== null ? 'reagent-own-volume-only' : 'not-computable-uncorrected';

  // Target in base units (mg/mL, IU/mL, U/mL); a molar target through the imported MW.
  let targetBase = null;
  let mwGperMol = c1 ? c1.mwGperMol : null;
  if (direction === 'target') {
    if (molarTarget) {
      const tM = U.toBase(target.value, targetUnit.symbol);
      targetBase = mut('molarTarget', tM * mwGperMol, {}); // M × g/mol = g/L = mg/mL
    } else {
      targetBase = mut('target', U.toBase(mut('targetRaw', target.value, { unit: targetUnit.symbol }), targetUnit.symbol), { unit: targetUnit.symbol });
    }
  }

  // A positive quantity that underflows to zero, or overflows, partway through is
  // not representable — checked here, before C7-HI-08 could read 0 ≥ 0 as the
  // solids filling the vial (adversarial finding F-3).
  const positive = (x) => x === null || (Number.isFinite(x) && x > 0);
  {
    const derived = [[contentBase, 'the stated content in base units'], [isMass ? U.toGrams(content.value, cUnit) : null, 'the stated content in grams'], [solidsG, 'the total solids mass in grams'], [D, 'the displacement volume D'], [Dmin, 'the minimum displacement Dmin'], [targetBase, 'the target concentration in base units']];
    const bad = derived.find(([x]) => !positive(x));
    if (bad) return unrepresentable(declarations, c1, threshold, bad[1]);
  }

  const volUnit = direction === 'target' ? 'mL' : enteredUnit.symbol; // the unit volumes are displayed in
  const knownVolume = direction === 'volume' && volumeBasis === 'diluent' ? 'diluent' : 'final';
  let F; let Vd; let VdPrimeDec; let VdPrimeBase; let VdEntered = false;
  if (direction === 'target' || volumeBasis === 'final') {
    F = direction === 'target' ? contentBase / targetBase : U.toBase(mut('enteredRaw', entered.value, { unit: volUnit }), volUnit);
    if (!positive(F)) return unrepresentable(declarations, c1, threshold, 'the final volume of the determination (F)');
    // C7-HI-08, evaluated in this form, on computed values.
    const Dguard = D !== null ? D : Dmin;
    if (Dguard !== null && Dguard >= F) {
      const which = direction === 'target' ? `the target ${target.text} ${targetUnit.symbol}` : `the entered final volume ${entered.text} ${volUnit}`;
      const mass = D !== null ? `the total solids mass (${solidsSource === 'the declared total solids mass' ? `${solids.text} ${solidsUnit.symbol}` : `${content.text} ${cUnit}`})` : `the reagent mass (${content.text} ${cUnit}; total solids not declared)`;
      reject('C7-HI-08', `At ${which}, ${mass} alone would occupy ${sig(U.fromBase(Dguard, volUnit), 3)} ${volUnit} at v̄ = ${VBAR.value} ${VBAR.unit} — the whole of the ${sig(U.fromBase(F, volUnit), 3)} ${volUnit} final volume — so no volume of diluent reaches it.`);
      return done('rejected', { declarations, incomplete: [], rejections, c1 });
    }
    Vd = mut('Vd', F - Dapp, {});
    if (!Number.isFinite(Vd) || !(Vd > 0)) return unrepresentable(declarations, c1, threshold, 'the diluent volume (Vd)');
    VdPrimeDec = roundDec(U.fromBase(Vd, volUnit), PRECISION.volumes);
    VdPrimeBase = U.toBase(Dec.toNumber(VdPrimeDec), volUnit);
  } else {
    VdEntered = true;
    VdPrimeDec = entered.dec;
    VdPrimeBase = U.toBase(mut('enteredRaw', entered.value, { unit: volUnit }), volUnit);
    Vd = VdPrimeBase;
    F = VdPrimeBase + Dapp;
  }
  const Fa = VdPrimeBase + Dapp;
  const Ca = mut('Ca', contentBase / Fa, {}); // mg/mL, IU/mL or U/mL
  {
    const bad = [[F, 'the final volume of the determination (F)'], [Fa, 'the achieved final volume (Fa)'], [Ca, 'the concentration (Ca)']].find(([x]) => !(Number.isFinite(x) && x > 0));
    if (bad) return unrepresentable(declarations, c1, threshold, bad[1]);
  }
  const f = D !== null ? D / F : null;
  const fmin = Dmin !== null ? Dmin / F : null;
  // With the diluent known, C7-FL-08's 1 ÷ (1 − f) and f ÷ (1 − f) are computed
  // as F ÷ Vd′ and D ÷ Vd′ — the same relations, since 1 − f = Vd′ ÷ F — so that a
  // diluent negligible beside D does not cancel 1 − f to zero in binary
  // (adversarial finding F-1). Only a factor genuinely beyond the double range
  // makes the determination not representable.
  const overFactor = D !== null && knownVolume === 'diluent' ? F / VdPrimeBase : null;
  const overFrac = D !== null && knownVolume === 'diluent' ? D / VdPrimeBase : null;
  if (overFactor !== null && !(Number.isFinite(overFactor) && Number.isFinite(overFrac))) return unrepresentable(declarations, c1, threshold, 'the C7-FL-08 overstatement factor 1 ÷ (1 − f)');

  // ---------- displayed values ----------
  const volDisp = (x) => sig(U.fromBase(x, volUnit), PRECISION.volumes);
  const VdPrimeDisplay = VdEntered ? entered.text : Dec.toString(VdPrimeDec);
  // A bound is displayed on its own side: "at least" final volumes round down
  // (decision of 28 September 2026). Every other volume rounds half away from zero.
  const faIsLowerBound = treatment === 'reagent-own-volume-only';
  const FaDisplay = faIsLowerBound ? sigDirected(U.fromBase(Fa, volUnit), PRECISION.volumes, 'down') : volDisp(Fa);
  const DappDisplay = Dapp > 0 ? volDisp(Dapp) : null;

  // C7-IV-03 additivity: |Vd′ + displayed D − displayed final| ≤ one unit of the coarsest displayed place.
  let additivity = null;
  if (DappDisplay !== null) {
    const a = VdEntered ? entered.dec : VdPrimeDec;
    const b = Dec.fromString(DappDisplay);
    const c = Dec.fromString(FaDisplay);
    const gap = Dec.abs(Dec.sub(Dec.add(a, b), c));
    const coarsest = Math.max(a.exp, b.exp, c.exp);
    const unit = { neg: false, mant: 1n, exp: coarsest };
    // C7-IV-03's one-unit bound is ½u(D) + ½u(F) under half-away rounding. With the
    // final volume rounded down as a lower bound it becomes < 1u(F) + ½u(D), and that
    // is the bound checked and stated (decision of 28 September 2026).
    const bound = faIsLowerBound ? Dec.add(unit, { neg: false, mant: 5n, exp: b.exp - 1 }) : unit;
    additivity = { disagreement: Dec.toString(Dec.trimZeros(gap)), unit: volUnit, coarsestPlace: Dec.toString(unit), bound: Dec.toString(Dec.trimZeros(bound)), boundRule: faIsLowerBound ? 'one unit of the final volume\'s place plus half a unit of the displacement\'s' : 'one unit of the coarsest displayed place', holds: Dec.cmp(gap, bound) <= 0 };
  }

  // Concentration display unit: the target's (mass or activity), the selected report unit,
  // or mg/mL for the mass form beside a molar target.
  const concDisplayUnit = direction === 'target' ? (molarTarget ? 'mg/mL' : targetUnit.symbol) : reportUnit.symbol;
  const CaDisplayValue = U.fromBase(Ca, concDisplayUnit);
  // An "at most" concentration rounds up, so the displayed figure is itself an
  // upper bound (decision of 28 September 2026); every other concentration rounds
  // half away from zero (C7-UN-06).
  const concIsUpperBound = treatment === 'reagent-own-volume-only';
  const concRound = (x) => (concIsUpperBound ? sigDirected(x, PRECISION.concentrations, 'up') : sig(x, PRECISION.concentrations));
  const CaDisplay = concRound(CaDisplayValue);

  // Labels (C7-DT-07).
  let concLabel; let concLabelText;
  const at = VdEntered ? 'at the entered diluent volume' : 'at the displayed diluent volume';
  if (treatment === 'computed') { concLabel = VdEntered ? 'obtained' : 'achieved'; concLabelText = VdEntered ? 'obtained at the entered diluent volume' : 'achieved at the displayed diluent volume'; }
  else if (treatment === 'reagent-own-volume-only') { concLabel = 'at-most'; concLabelText = `at most — ${at}`; }
  else { concLabel = 'uncorrected-for-displacement'; concLabelText = 'uncorrected for displacement'; }

  const concOf = contentBasis === 'total-vial-contents' ? 'total solids — reagent, carrier and excipient together'
    : contentBasis === 'not-recorded' ? 'the stated content (basis not recorded)'
      : contentBasis === 'reagent-activity' ? 'the reagent (activity)'
        : conjugate === 'protein' ? 'the reagent — the protein alone, exclusive of label or payload'
          : conjugate === 'conjugate' ? 'the reagent — the conjugate, including label or payload'
            : 'the reagent';

  // The target, and the achieved departure from it (C7-DT-07, C7-FX-17).
  let targetOut = null;
  if (direction === 'target') {
    const inUnit = molarTarget ? U.fromBase(targetBase, 'mg/mL') : target.value;
    targetOut = {
      entered: { text: target.text, unit: targetUnit.symbol },
      display: sig(target.value, PRECISION.concentrations),
      unit: targetUnit.symbol,
      unrounded: target.value,
      massEquivalent: molarTarget ? q(sig(inUnit, PRECISION.concentrations), 'mg/mL', inUnit) : null,
      // Taken on the unrounded values (C7-UN-07), and labelled so (T2). The departure
      // rises with the concentration, so the departure of an "at most" concentration
      // is itself an upper bound: labelled "at most" and rounded toward +∞, like the
      // concentration it comes from (decision of 28 September 2026, extended).
      departure: concIsUpperBound
        ? { ratioOf: 'reported concentration ÷ target − 1, on the unrounded values', isUpperBound: true, rounding: 'up', unrounded: CaDisplayValue / inUnit - 1, display: `${signedPctUp(CaDisplayValue / inUnit - 1)} %` }
        : { ratioOf: 'reported concentration ÷ target − 1, on the unrounded values', isUpperBound: false, rounding: 'half away from zero', unrounded: CaDisplayValue / inUnit - 1, display: `${signedPct(CaDisplayValue / inUnit - 1)} %` },
    };
  }

  // Molar form (C7-DT-06) or its withholding (C7-FL-09).
  let molar = null;
  if (c1) {
    if (isMass && pair.permitted) {
      const CaM = Ca / mwGperMol; // (mg/mL = g/L) ÷ g/mol = mol/L
      molar = molarUnit
        ? { status: 'reported', display: concRound(U.fromBase(CaM, molarUnit.symbol)), rounding: concIsUpperBound ? 'up' : 'half away from zero', unit: molarUnit.symbol, unrounded: U.fromBase(CaM, molarUnit.symbol), molarityOf: pair.molarityOf, label: concLabel, pairingRow: pair.row }
        : { status: 'unit-not-selected', molarityOf: pair.molarityOf, pairingRow: pair.row, reason: 'Select a unit for the molar form.' };
    } else {
      const p = pair || pairing({ c1Basis: c1.massBasis, c7Basis: 'reagent-activity', conjugate: null });
      molar = { status: 'withheld', reason: p.reason, pairingRow: p.row, bases: p.bases };
    }
  }

  // ---------- flags (§8) ----------
  const flags = [];
  const flag = (code, title, message, evaluatedOn, payload = {}) => flags.push({ code, title, message, evaluatedOn, payload });
  const known = knownVolume === 'final';

  if (contentBasis === 'total-vial-contents') flag('C7-FL-01', 'Concentration is of total solids, not the reagent', 'The concentration computed is of total solids — reagent, carrier and excipient together — and is not the concentration of the reagent. Where a carrier protein is present, the reagent\'s concentration may be lower by a large factor. This tool cannot determine it.', 'the content declaration');
  if (contentBasis === 'not-recorded') flag('C7-FL-02', 'Content basis not recorded', 'Whether the stated content refers to the reagent alone or to the total vial contents is not recorded; the resulting concentration cannot be interpreted and should not be carried into a method record without it.', 'the content declaration');
  if (provenance === 'nominal') flag('C7-FL-03', 'Nominal fill, not the lot\'s measured content', 'The content figure is the nominal fill, not the lot\'s measured content. A lot-specific certificate, where one exists, states what the vial actually held.', 'the provenance declaration');
  if (provenance === 'not-recorded') flag('C7-FL-04', 'Content provenance not recorded', 'Content provenance not recorded; the stock cannot be traced to a source.', 'the provenance declaration');

  const thresholdText = `${pct(threshold)} %${threshold === MATERIAL_THRESHOLD.value && MATERIAL_THRESHOLD.provisional ? ' (provisional placeholder; the ISO 8655-2 citation is outstanding)' : threshold !== MATERIAL_THRESHOLD.value ? ' (configured for this determination)' : ''}`;
  if (treatment !== 'computed') {
    if (treatment === 'reagent-own-volume-only') {
      const exceeds = fmin > threshold;
      const fminRelation = direction === 'target' ? 'v̄ × target' : 'v̄ × content ÷ F';
      flag('C7-FL-05', 'Displacement not computable — reagent\'s own volume only; concentration is at most', `The volume the dissolved solids occupy cannot be computed because the total solids mass is not known. The displacement has been corrected for the reagent's own volume only (Dmin = content × v̄ = ${volDisp(Dmin)} ${volUnit}); the displacement of carrier and excipient is not included. The concentration reported is therefore an upper bound — "at most" — under the stated assumptions for Dmin, to within v̄'s scope error, and the concentration obtained is below it by an amount that cannot be computed from the declared inputs. The minimum displacement fraction fmin = Dmin ÷ final volume (${fminRelation}) is ${pct(fmin)} %, which ${exceeds ? 'exceeds' : 'does not exceed'} the material threshold of C7-FL-08, ${thresholdText}.`, 'the available inputs; Dmin', { Dmin: q(volDisp(Dmin), volUnit, U.fromBase(Dmin, volUnit)), fmin: { display: `${pct(fmin)} %`, ratioOf: 'Dmin ÷ final volume of the determination', unrounded: fmin }, exceedsThreshold: exceeds, threshold });
    } else {
      flag('C7-FL-05', 'Displacement not computable — no correction applied', `The volume the dissolved solids occupy cannot be computed because the total solids mass is not known. ${isActivity ? 'The content is stated in activity units, so there is no reagent mass from which a minimum displacement could be computed' : 'The content basis is not recorded, so the stated mass may be total solids, for which the reagent\'s own volume is not a lower bound'}. No correction is applied and no bound is available: the reported concentration overstates the one obtained by an amount that cannot be computed.`, 'the available inputs');
    }
  }

  if (cap) {
    const capBase = U.toBase(cap.value, capUnit.symbol);
    if (Fa > capBase) {
      flag('C7-FL-06', 'Final volume exceeds the declared vial capacity', `The final volume, ${FaDisplay} ${volUnit}, exceeds the declared vial working capacity of ${cap.text} ${capUnit.symbol}; the reconstitution cannot be performed in this vial.${treatment !== 'computed' ? ' The displacement applied is ' + (treatment === 'reagent-own-volume-only' ? 'the reagent\'s own volume only' : 'none') + ', so the check used a final volume that may be smaller than the true one, and cannot rule out a larger one.' : ''}`, 'the achieved final volume Fa', { Fa: q(FaDisplay, volUnit, U.fromBase(Fa, volUnit)), capacity: { value: cap.text, unit: capUnit.symbol } });
    }
  }

  // C7-FL-07 on Vd′ as a displayed decimal, compared exactly in µL.
  const vdUl = Dec.shift(VdPrimeDec, U.volumeExponentToMicrolitres(volUnit));
  const minUl = Dec.shift(minT.dec, U.volumeExponentToMicrolitres(minUnit.symbol));
  if (Dec.cmp(vdUl, minUl) < 0) {
    flag('C7-FL-07', 'Diluent below the declared minimum transfer volume', `The diluent volume, ${VdPrimeDisplay} ${volUnit}, is below the declared minimum reliable transfer volume of ${minT.text} ${minUnit.symbol} and cannot be delivered reliably. A lower target concentration, or a vial of different content, is required.`, 'the diluent volume as delivered, Vd′', { diluent: { display: VdPrimeDisplay, unit: volUnit }, minimum: { value: minT.text, unit: minUnit.symbol } });
  }

  if (treatment === 'computed' && f > threshold) {
    const payload = { f: { display: `${pct(f)} %`, ratioOf: 'displacement volume ÷ final volume of the determination', unrounded: f }, threshold, knownVolume };
    let msg = `The dissolved solids occupy ${pct(f)} % of the final volume (f = D ÷ F, D = ${volDisp(D)} ${volUnit}), above the material threshold of ${thresholdText}. `;
    if (known) {
      const factor = 1 / (1 + f); const shortfall = f / (1 + f);
      payload.factor = { display: sig(factor, 3), ratioOf: 'concentration obtained by delivering the final volume as diluent ÷ intended concentration', relation: '1 ÷ (1 + f)', unrounded: factor };
      payload.shortfall = { display: `${pct(shortfall)} %`, ratioOf: 'shortfall of that concentration below the intended one, f ÷ (1 + f)', unrounded: shortfall };
      msg += `The diluent to add is smaller than the final volume by the displacement. Delivering the final volume as diluent instead gives (content ÷ F) ÷ (1 + f)${direction === 'target' ? ' — the target ÷ (1 + f)' : ''}: a factor of ${sig(factor, 3)}, a shortfall of ${pct(shortfall)} %.`;
    } else {
      const factor = overFactor; const over = overFrac;
      payload.factor = { display: sig(factor, 3), ratioOf: 'content ÷ diluent volume, over the concentration obtained', relation: '1 ÷ (1 − f)', unrounded: factor };
      payload.overstatement = { display: `${pct(over)} %`, ratioOf: 'overstatement of content ÷ diluent volume above the concentration obtained, f ÷ (1 − f)', unrounded: over };
      msg += `Dividing the content by the diluent volume overstates the concentration obtained by the factor 1 ÷ (1 − f) = ${sig(factor, 3)}: an overstatement of ${pct(over)} %.`;
    }
    flag('C7-FL-08', `Displacement is material: ${pct(f)} % of the final volume`, msg, 'f on the determination', payload);
  }

  if (c1 && molar.status === 'withheld') {
    flag('C7-FL-09', 'Molar form withheld', `The molar form is withheld: ${molar.reason} (§8 pairing table, row ${molar.pairingRow}). Declared bases: molecular weight — ${molar.bases.c1MassBasis}; content — ${molar.bases.contentBasis}; conjugate — ${molar.bases.conjugate}. The mass-based result stands.`, 'the declarations', { pairingRow: molar.pairingRow });
  }
  if (c1 && c1.flags.length) {
    flag('C7-FL-10', `Imported C1 value carries ${c1.flags.length} flag${c1.flags.length === 1 ? '' : 's'}`, `The imported molecular weight's flags, restated in full: ${c1.flags.map((x) => `${x.code}: ${x.message}`).join(' ')}`, 'the imported result object', { c1Flags: c1.flags.map((x) => x.code) });
  }
  if (carrier === 'present') flag('C7-FL-11', 'Carrier protein present — a protein assay reports carrier', `The stock contains carrier protein — ${D !== null && solidsSource === 'the declared total solids mass' ? `within the declared total solids mass of ${solids.text} ${solidsUnit.symbol}` : 'at a mass not stated'}. A protein assay of this stock reports carrier, not the reagent. The reagent's concentration is the computed one only on the declared content basis.`, 'the carrier declaration');
  if (carrier === 'not-recorded') flag('C7-FL-12', 'Carrier presence not recorded', 'Whether the stock contains carrier protein is not recorded; a protein assay of it cannot be interpreted against the computed concentration.', 'the carrier declaration');
  if (conjugate === 'protein' || conjugate === 'conjugate') flag('C7-FL-13', `Conjugate — concentration is of the ${conjugate === 'protein' ? 'protein alone' : 'conjugate'}`, `The concentration is of the ${conjugate === 'protein' ? 'protein alone, exclusive of label or payload' : 'conjugate, including label or payload'}, as declared; the tool does not correct for degree of labelling. Carried onward with the stock.`, 'the conjugate declaration');
  if (conjugate === 'not-recorded') flag('C7-FL-14', 'Conjugate state not recorded', 'Whether the stated mass includes a label or payload is not recorded; the concentration cannot be paired with a molecular weight and should not be carried into a method record without it.', 'the conjugate declaration');

  // ---------- volumes (C7-VB-02, C7-OUT-03) ----------
  const primary = volumeBasis; // entered, or shown first
  const diluentRole = VdEntered ? 'entered' : primary === 'diluent' ? 'primary' : 'derived';
  const finalRole = direction === 'volume' && volumeBasis === 'final' ? 'derived-achieved' : primary === 'final' ? 'primary' : 'derived';
  const diluentLabel = treatment === 'reagent-own-volume-only' ? DILUENT_DMIN_LABEL : treatment === 'not-computable-uncorrected' ? 'no displacement correction applied' : 'smaller than the final volume by the displacement';
  const volumes = {
    unit: volUnit,
    primary,
    diluent: { ...q(VdPrimeDisplay, volUnit, U.fromBase(VdPrimeBase, volUnit)), role: diluentRole, label: diluentLabel, unroundedBeforeDisplay: U.fromBase(Vd, volUnit) },
    final: { ...q(FaDisplay, volUnit, U.fromBase(Fa, volUnit)), role: finalRole, label: treatment === 'reagent-own-volume-only' ? 'at least' : treatment === 'computed' ? 'achieved final volume' : 'uncorrected for displacement', isLowerBound: faIsLowerBound, rounding: faIsLowerBound ? 'down' : 'half away from zero' },
    enteredFinal: direction === 'volume' && volumeBasis === 'final' ? { display: entered.text, unit: volUnit, unrounded: entered.value, role: 'entered' } : null,
    additivity,
  };

  // ---------- displacement (C7-DT-03) ----------
  const displacement = {
    treatment,
    vbar: { value: VBAR.value, unit: VBAR.unit },
    solidsSource,
    computed: D !== null ? { D: q(volDisp(D), volUnit, U.fromBase(D, volUnit)), f: { display: `${pct(f)} %`, ratioOf: 'displacement volume ÷ final volume of the determination', unrounded: f } } : null,
    notComputable: D === null ? { reason: isActivity ? 'the total solids mass is not declared, and activity content has no mass' : contentBasis === 'not-recorded' ? 'the content basis is not recorded, so the solids mass is unknown' : 'the total solids mass is not declared' } : null,
    Dmin: Dmin !== null ? { ...q(volDisp(Dmin), volUnit, U.fromBase(Dmin, volUnit)), fmin: { display: `${pct(fmin)} %`, ratioOf: 'Dmin ÷ final volume of the determination', unrounded: fmin }, applied: true, label: 'reagent\'s own volume only' } : null,
    applied: q(DappDisplay ?? '0', volUnit, U.fromBase(Dapp, volUnit)),
  };

  // ---------- concentration (C7-DT-04, C7-DT-07) ----------
  const isUpper = treatment === 'reagent-own-volume-only';
  const concentration = {
    reported: { display: CaDisplay, unit: concDisplayUnit, unrounded: CaDisplayValue, label: concLabel, labelText: concLabelText, of: concOf, rounding: concIsUpperBound ? 'up' : 'half away from zero' },
    upperBound: isUpper ? { isUpperBound: true, reason: UPPER_BOUND_REASON, assumptions: [A_DMIN_POLICY, A_PROTEIN, A_NO_SHRINK, A_ADDITIVE] } : { isUpperBound: false },
    reagent: contentBasis === 'total-vial-contents'
      ? { computable: false, reason: 'The stated content is the total vial contents; the reagent\'s share of it is not known, so the reagent\'s concentration cannot be computed. It is not equal to the total-solids concentration.' }
      : { computable: true, same: 'the reported concentration' },
    molar,
    handedOnward: 'the reported concentration',
  };

  // ---------- relations (C7-DT-08) ----------
  const relations = [];
  if (D !== null) relations.push(`D = solids × v̄ = ${fmtG(solidsG)} g × ${VBAR.value} mL/g = ${volDisp(D)} ${volUnit}`);
  if (Dmin !== null) relations.push(`Dmin = content × v̄ = ${fmtG(U.toGrams(content.value, cUnit))} g × ${VBAR.value} mL/g = ${volDisp(Dmin)} ${volUnit} (reagent's own volume only; applied as a partial correction)`);
  if (Dapp === 0) relations.push('Dapp = 0 — no displacement correction applied');
  if (direction === 'target') {
    relations.push(`F = content ÷ target = ${content.text} ${cUnit} ÷ ${target.text} ${targetUnit.symbol}${molarTarget ? ` (× ${sigMw(mwGperMol)} g/mol = ${sig(targetBase, 6)} mg/mL)` : ''} = ${volDisp(F)} mL`);
    relations.push(`Vd = F − Dapp; Vd′ = Vd rounded to 3 sf from its own value = ${VdPrimeDisplay} mL`);
  } else if (volumeBasis === 'final') {
    relations.push(`F = entered final volume = ${entered.text} ${volUnit}`);
    relations.push(`Vd = F − Dapp; Vd′ = Vd rounded to 3 sf from its own value = ${VdPrimeDisplay} ${volUnit}`);
  } else {
    relations.push(`Vd′ = entered diluent volume = ${entered.text} ${volUnit}, used as entered`);
    relations.push(`F = Vd′ + Dapp`);
  }
  relations.push(`Fa = Vd′ + Dapp (Dapp unrounded) = ${FaDisplay} ${volUnit}`);
  relations.push(`Ca = content ÷ Fa = ${CaDisplay} ${concDisplayUnit} — ${concLabelText}`);
  if (f !== null) relations.push(`f = D ÷ F = ${pct(f)} %`);
  if (fmin !== null) relations.push(`fmin = Dmin ÷ F = ${pct(fmin)} %`);
  if (molar && molar.status === 'reported') relations.push(`molar form = Ca ÷ MW = ${molar.display} ${molar.unit} (molarity of ${molar.molarityOf})`);

  // ---------- declarations applied (C7-OUT-02) ----------
  // Every declaration in the derivation, with how it entered this determination —
  // not only in the input echo.
  const flagged = (code) => flags.some((x) => x.code === code);
  const dl = declarations;
  const applied = [
    { declaration: 'Direction', value: dl.direction.label, effect: direction === 'target' ? 'F = content ÷ target; the diluent is computed and rounded from its own value' : knownVolume === 'diluent' ? 'the entered diluent is used as entered; F = Vd′ + Dapp' : 'the entered final volume is F; the diluent is computed from it and rounded from its own value, and Fa is reported beside the entered final' },
    { declaration: 'Content basis', value: dl.contentBasis.label, effect: `the concentration is of ${concOf}; Dmin is ${Dmin !== null ? 'defined and applied' : contentBasis === 'reagent-alone' ? 'defined but not needed (solids declared)' : 'not defined'}${contentBasis === 'total-vial-contents' ? '; the total solids mass is the stated content; the reagent\'s concentration is not computable' : ''}${flagged('C7-FL-01') ? ' (C7-FL-01)' : flagged('C7-FL-02') ? ' (C7-FL-02)' : ''}` },
    { declaration: 'Source of the content', value: dl.contentProvenance.label, effect: `recorded, not corrected: no fill tolerance is applied${flagged('C7-FL-03') ? ' (C7-FL-03)' : flagged('C7-FL-04') ? ' (C7-FL-04)' : ''}` },
    { declaration: 'Conjugate state', value: dl.conjugate.label, effect: isActivity ? 'not asked: activity content has no molar route' : `${conjugate === 'protein' || conjugate === 'conjugate' ? `the concentration is of the ${conjugate === 'protein' ? 'protein alone' : 'conjugate'}; no degree-of-labelling correction (C7-FL-13)` : conjugate === 'not-recorded' ? 'the concentration cannot be paired with a molecular weight (C7-FL-14)' : 'no label or payload in the stated mass'}${pair ? `; §8 pairing row ${pair.row}, molar form ${pair.permitted ? 'permitted' : 'not permitted'}` : ''}` },
    { declaration: 'Carrier', value: dl.carrier.label, effect: carrier === 'present' ? 'carried onward; a protein assay of this stock reports carrier (C7-FL-11)' : carrier === 'not-recorded' ? 'carried onward as not recorded (C7-FL-12)' : 'carried onward' },
    { declaration: 'Whole vial', value: 'confirmed', effect: 'the whole stated content is divided by the achieved final volume; no fraction is taken' },
    { declaration: 'Volume basis', value: dl.volumeBasis.label, effect: VdEntered ? 'the diluent is the entered volume' : direction === 'volume' ? 'the final volume is the entered volume' : `the ${volumeBasis === 'diluent' ? 'diluent' : 'final volume'} is shown first and handed onward first; the concentration does not depend on this choice` },
    { declaration: 'Displacement treatment', value: treatment === 'computed' ? 'computed' : treatment === 'reagent-own-volume-only' ? 'reagent\'s own volume only' : 'none', effect: treatment === 'computed' ? `D = ${volDisp(D)} ${volUnit} from ${solidsSource}, applied in full` : treatment === 'reagent-own-volume-only' ? `Dmin = ${volDisp(Dmin)} ${volUnit} applied as a partial correction; the concentration is an upper bound (C7-FL-05)` : 'not computable; no correction applied and no bound available (C7-FL-05)' },
    { declaration: 'Minimum transfer volume', value: `${minT.text} ${minUnit.symbol} (${dl.minTransfer.source})`, effect: `Vd′ = ${VdPrimeDisplay} ${volUnit} compared against it: ${flagged('C7-FL-07') ? 'below it (C7-FL-07)' : 'not below it'}` },
    { declaration: 'Vial working capacity', value: cap ? `${cap.text} ${capUnit.symbol}` : 'not declared', effect: cap ? `Fa = ${FaDisplay} ${volUnit} compared against it: ${flagged('C7-FL-06') ? 'exceeds it (C7-FL-06)' : 'within it'}` : 'C7-FL-06 not evaluated' },
  ];
  if (c1) applied.push({ declaration: 'Molecular weight (C1)', value: `${c1.mw.value} ${c1.mw.unit}`, effect: molar.status === 'withheld' ? `molar form withheld (§8 row ${molar.pairingRow}, C7-FL-09)` : `molar form of the concentration, molarity of ${molar.molarityOf}` });

  const assumptions = [A_DISSOLVE];
  if (treatment === 'computed') assumptions.unshift(A_ADDITIVE);
  if (treatment === 'reagent-own-volume-only') assumptions.unshift(A_DMIN_POLICY, A_PROTEIN, A_NO_SHRINK);
  if (treatment === 'not-computable-uncorrected') assumptions.unshift(A_DMIN_POLICY);

  const unrounded = {
    content: { value: contentBase, unit: isMass ? 'mg' : cUnit },
    F: { value: F, unit: 'mL' },
    D: D !== null ? { value: D, unit: 'mL' } : null,
    Dmin: Dmin !== null ? { value: Dmin, unit: 'mL' } : null,
    Dapp: { value: Dapp, unit: 'mL' },
    f, fmin,
    Vd: { value: Vd, unit: 'mL' },
    VdPrime: { value: VdPrimeBase, unit: 'mL' },
    Fa: { value: Fa, unit: 'mL' },
    Ca: { value: Ca, unit: isMass ? 'mg/mL' : `${cUnit}/mL` },
    target: targetBase !== null ? { value: targetBase, unit: isMass ? 'mg/mL' : `${cUnit}/mL` } : null,
  };

  return done('result', { declarations, incomplete: [], rejections: [], c1, volumes, displacement, concentration, target: targetOut, flags, relations, declarationsApplied: applied, assumptions, unrounded });
}

/**
 * C7-HI-10 (URS v1.1 §7, bound on the specification owner's instruction of
 * 29 September 2026; v1.1's text is not yet in spec/): not computed because a
 * quantity lies outside the range of IEEE-754 doubles — a limit of the
 * arithmetic, not a physical impossibility and not a missing declaration. Its
 * own status and state, naming the quantity, with the code carried as a §7
 * rejection so it renders beside the message as C7-HI-08 and C7-HI-03 do.
 */
function unrepresentable(declarations, c1, threshold, quantity) {
  const message = `Not computed: ${quantity} lies outside the range of numbers this arithmetic can represent (about 10⁻³⁰⁸ to 10³⁰⁸). This is a limit of the arithmetic, not a physical impossibility; check the magnitudes and units entered.`;
  return shell('not-representable', { declarations, rejections: [{ code: 'C7-HI-10', message }], c1, threshold, incomplete: [], notRepresentable: { code: 'C7-HI-10', quantity, message } });
}

function fmtG(g) { return sig(g, 6); }
function sigMw(x) { return sig(x, 6); }

function buildDeclarations(d) {
  const lab = (map, v) => (v ? { value: v, label: map[v] } : null);
  return {
    direction: lab(DIRECTION, d.direction || null),
    content: d.content && !d.content.invalid && d.contentUnit ? { value: d.content.text, unit: d.contentUnit.symbol, dimension: d.contentUnit.family === U.FAMILY.MASS ? 'mass' : 'activity' } : null,
    wholeVial: { confirmed: d.wholeVial },
    contentBasis: lab(CONTENT_BASIS, d.contentBasis),
    contentProvenance: lab(PROVENANCE, d.provenance),
    conjugate: d.contentUnit && d.contentUnit.family !== U.FAMILY.MASS ? { value: 'not-applicable', label: 'not asked — activity content has no molar route' } : lab(CONJUGATE, d.conjugate),
    carrier: lab(CARRIER, d.carrier),
    volumeBasis: lab(VOLUME_BASIS, d.volumeBasis),
    totalSolids: d.contentBasis === 'total-vial-contents'
      ? { declared: false, equalsContent: true, note: 'the stated content is the total vial contents' }
      : d.solidsOffered
        ? (d.solids && !d.solids.invalid && d.solidsUnit ? { declared: true, value: d.solids.text, unit: d.solidsUnit.symbol } : { declared: false })
        : { declared: false, offered: false, note: 'not offered: the content basis is not recorded' },
    minTransfer: d.minT && !d.minT.invalid && d.minUnit ? { value: d.minT.text, unit: d.minUnit.symbol, source: d.minIsDefault ? 'default' : 'entered' } : null,
    capacity: d.cap && !d.cap.invalid && d.capUnit ? { declared: true, value: d.cap.text, unit: d.capUnit.symbol } : { declared: false, note: 'no capacity declared; C7-FL-06 not evaluated' },
    target: d.direction === 'target' && d.target && !d.target.invalid && d.targetUnit ? { value: d.target.text, unit: d.targetUnit.symbol } : null,
    enteredVolume: d.direction === 'volume' && d.entered && !d.entered.invalid && d.enteredUnit ? { value: d.entered.text, unit: d.enteredUnit.symbol, is: d.volumeBasis ? VOLUME_BASIS[d.volumeBasis] : null } : null,
    reportUnit: d.reportUnit ? d.reportUnit.symbol : null,
    molecularWeight: d.c1 ? { value: d.c1.mw.value, unit: d.c1.mw.unit, source: { value: d.c1.provenance, label: C1_MW_PROVENANCE[d.c1.provenance] || d.c1.provenance }, massBasis: { value: d.c1.massBasis, label: C1_MASS_BASIS[d.c1.massBasis] }, importedFrom: 'C1' } : null,
  };
}

function shell(status, parts) {
  const r = {
    schema: { name: SCHEMA.name, version: SCHEMA.version },
    tool: { id: TOOL_ID, name: TOOL_NAME, engineVersion: ENGINE_VERSION },
    ursVersion: URS_VERSION,
    publisher: 'Ligant',
    status,
    declarations: parts.declarations,
    incomplete: parts.incomplete,
    rejections: parts.rejections,
    notRepresentable: parts.notRepresentable || null,
    volumes: parts.volumes || null,
    displacement: parts.displacement || null,
    concentration: parts.concentration || null,
    target: parts.target || null,
    flags: parts.flags || [],
    relations: parts.relations || [],
    declarationsApplied: parts.declarationsApplied || [],
    assumptions: parts.assumptions || [],
    precision: { volumes: PRECISION.volumes, concentrations: PRECISION.concentrations, fractions: PRECISION.fractions, rounding: PRECISION.rounding, boundRounding: PRECISION.boundRounding },
    constants: {
      vbar: { value: VBAR.value, unit: VBAR.unit, status: VBAR.status },
      materialThreshold: parts.threshold === undefined || parts.threshold === MATERIAL_THRESHOLD.value ? { value: MATERIAL_THRESHOLD.value, status: MATERIAL_THRESHOLD.status, provisional: MATERIAL_THRESHOLD.provisional } : { value: parts.threshold, status: 'configured', provisional: false, registered: MATERIAL_THRESHOLD.value },
      tolerances: { roundTrip: TOLERANCES.roundTrip, unitNormalisation: TOLERANCES.unitNormalisation, status: 'open' },
    },
    statements: { scope: PRIVACY_SCOPE, determinesNotVerifies: DETERMINES_NOT_VERIFIES, precision: PRECISION_STATEMENT, hi08: HI08_SENTENCE },
    unrounded: parts.unrounded || null,
    importedC1: parts.c1 ? parts.c1.payload : null,
  };
  return r;
}
