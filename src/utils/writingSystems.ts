/**
 * Writing systems selectable from the font preview's "writing system" dropdown (see
 * `useWritingSystems.ts`). For each script we keep a handful of representative letters
 * (`probe`) — enough for `coversAny` (see `glyphCoverage.ts`) to decide whether the loaded font
 * covers that script at all — and a fixed sample string used to fill the preview text when the
 * script is selected.
 *
 * The sample text is written natively in the script and is NOT translated per UI locale (like
 * fonts.google.com's per-script sample text, which doesn't change with the site's own language).
 * Only `labelKey` (the dropdown option's label) is localized. Well-known pangrams are used where
 * one is well-established (Latin, Greek, Cyrillic); other scripts use a short, simple phrase
 * chosen for correctness over completeness rather than an unverified pangram.
 *
 * Japanese, Chinese and Korean are included here even though `glyphSample.ts` (the glyph-grid
 * probe set, see Lot 2) deliberately excludes CJK: that file needs to sample a script broadly
 * enough for a grid, which isn't tractable for huge ideographic blocks without the real cmap.
 * This dropdown only needs a couple of probe code points plus one fixed sentence per script, so
 * the same objection doesn't apply — Japanese kana and Hangul are compact syllabaries anyway, and
 * Chinese only needs a few common Han ideographs to probe (not the full block).
 */

/** i18n keys for the dropdown option labels — kept as a literal union so `t(ws.labelKey)`
 *  type-checks against the generated message keys (see `src/utils/i18n.ts`). */
type ScriptLabelKey =
  | 'fontViewerScriptLatin'
  | 'fontViewerScriptGreek'
  | 'fontViewerScriptCyrillic'
  | 'fontViewerScriptArmenian'
  | 'fontViewerScriptHebrew'
  | 'fontViewerScriptArabic'
  | 'fontViewerScriptDevanagari'
  | 'fontViewerScriptThai'
  | 'fontViewerScriptEthiopic'
  | 'fontViewerScriptJapanese'
  | 'fontViewerScriptChinese'
  | 'fontViewerScriptKorean';

export interface WritingSystem {
  /** Stable identifier, also used as the React-free `:key` in the dropdown. */
  id: string;
  /** i18n key for the dropdown option's label. */
  labelKey: ScriptLabelKey;
  /** ISO 15924 script codes this entry represents (e.g. `Latn`, `Cyrl`, `Hans`/`Hant`).
   *  Used to map a UI language to its default sample (see `defaultWritingSystemFor`). */
  scriptCodes: string[];
  /** A few representative code points; the font is considered to support this script if it
   *  renders its own glyph for at least one of them (see `coversAny`). */
  probe: number[];
  /** Sample text used to fill the preview when this script is selected. */
  sample: string;
}

export const WRITING_SYSTEMS: WritingSystem[] = [
  {
    id: 'latin',
    labelKey: 'fontViewerScriptLatin',
    scriptCodes: ['Latn'],
    probe: [0x41, 0x61, 0xe9], // A, a, é
    sample: 'The quick brown fox jumps over the lazy dog',
  },
  {
    id: 'greek',
    labelKey: 'fontViewerScriptGreek',
    scriptCodes: ['Grek'],
    probe: [0x391, 0x3b1, 0x3a9], // Α, α, Ω
    sample: 'Ξεσκεπάζω την ψυχοφθόρα βδελυγμία',
  },
  {
    id: 'cyrillic',
    labelKey: 'fontViewerScriptCyrillic',
    scriptCodes: ['Cyrl'],
    probe: [0x410, 0x430, 0x44f], // А, а, я
    sample: 'Съешь же ещё этих мягких французских булок, да выпей чаю',
  },
  {
    id: 'armenian',
    labelKey: 'fontViewerScriptArmenian',
    scriptCodes: ['Armn'],
    probe: [0x531, 0x561], // Ա, ա
    sample: 'Բել դղյակի ձախ ժամն ինչու՞ չես ուղղում',
  },
  {
    id: 'hebrew',
    labelKey: 'fontViewerScriptHebrew',
    scriptCodes: ['Hebr'],
    probe: [0x5d0, 0x5d1], // א, ב
    sample: 'דג סקרן שט בים מאוכזב ולפתע מצא חברה',
  },
  {
    id: 'arabic',
    labelKey: 'fontViewerScriptArabic',
    scriptCodes: ['Arab'],
    probe: [0x627, 0x628], // ا, ب
    sample: 'نص حكيم له سر قاطع وذو شأن عظيم مكتوب على ثوب أخضر ومغلف بجلد أزرق',
  },
  {
    id: 'devanagari',
    labelKey: 'fontViewerScriptDevanagari',
    scriptCodes: ['Deva'],
    probe: [0x915, 0x905], // क, अ
    sample: 'नमस्ते, आप कैसे हैं?',
  },
  {
    id: 'thai',
    labelKey: 'fontViewerScriptThai',
    scriptCodes: ['Thai'],
    probe: [0xe01, 0xe31], // ก, ั
    sample: 'สวัสดีครับ ยินดีต้อนรับ',
  },
  {
    id: 'ethiopic',
    labelKey: 'fontViewerScriptEthiopic',
    scriptCodes: ['Ethi'],
    probe: [0x1200, 0x1208], // ሀ, ለ
    sample: 'ሰላም ለዓለም',
  },
  {
    id: 'japanese',
    labelKey: 'fontViewerScriptJapanese',
    scriptCodes: ['Jpan'],
    probe: [0x3042, 0x30a2, 0x3093], // あ, ア, ん (hiragana + katakana)
    sample: 'いろはにほへと ちりぬるを わかよたれそ つねならむ',
  },
  {
    id: 'chinese',
    labelKey: 'fontViewerScriptChinese',
    scriptCodes: ['Hans', 'Hant'],
    probe: [0x4e00, 0x4eba, 0x5927], // 一, 人, 大 (common Han ideographs)
    sample: '天地玄黄，宇宙洪荒',
  },
  {
    id: 'korean',
    labelKey: 'fontViewerScriptKorean',
    scriptCodes: ['Kore'],
    probe: [0xac00, 0xb098, 0xd55c], // 가, 나, 한 (Hangul syllables)
    sample: '다람쥐 헌 쳇바퀴에 타고파',
  },
];

/**
 * Picks a default writing system matching the browser's UI language, so the preview's initial
 * text (before the user touches the dropdown, see `useFontPreferences.ts`) looks native to the
 * reader rather than always defaulting to a Latin pangram. The language's ISO 15924 script is
 * derived generically via `Intl.Locale` (e.g. `ru`→Cyrl, `el`→Grek, `ar`→Arab, `ja`→Jpan,
 * `zh-TW`→Hant, `ko`→Kore) and matched against each entry's `scriptCodes` — no per-language
 * special-casing. Note `browser.i18n.getUILanguage()` returns the *browser's* language, which
 * need not be one of the extension's own locales, so this can legitimately surface a script we
 * don't ship UI strings for. Falls back to Latin for anything unrecognized (or if `Intl.Locale`
 * rejects the tag), same as fonts.google.com's specimen pages (whose sample text doesn't follow
 * the site's own language either).
 */
export function defaultWritingSystemFor(uiLanguage: string): WritingSystem {
  let script: string | undefined;
  try {
    script = new Intl.Locale(uiLanguage).maximize().script;
  } catch {
    script = undefined;
  }
  const match = script && WRITING_SYSTEMS.find((ws) => ws.scriptCodes.includes(script));
  return match || WRITING_SYSTEMS[0];
}
