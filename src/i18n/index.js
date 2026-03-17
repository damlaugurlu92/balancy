import tr from "./tr.js";
import en from "./en.js";

export const LANGS = { tr, en };

export function t(key, lang = "tr") {
  return key.split(".").reduce((obj, k) => obj?.[k], LANGS[lang]) ?? key;
}
