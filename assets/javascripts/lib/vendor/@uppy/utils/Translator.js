/* eslint-disable */
function insertReplacement(source, rx, replacement) {
  const newParts = [];

  source.forEach((chunk) => {
    if (typeof chunk !== "string") {
      newParts.push(chunk);
      return;
    }

    rx[Symbol.split](chunk).forEach((raw, i, list) => {
      if (raw !== "") {
        newParts.push(raw);
      }

      if (i < list.length - 1) {
        newParts.push(replacement);
      }
    });
  });

  return newParts;
}

function interpolate(phrase, options) {
  const dollarRegex = /\$/g;
  const dollarBillsYall = "$$$$";
  let interpolated = [phrase];

  if (!options) {
    return interpolated;
  }

  for (const arg of Object.keys(options)) {
    if (arg === "_") {
      continue;
    }

    let replacement = options[arg];

    if (typeof replacement === "string") {
      replacement = dollarRegex[Symbol.replace](replacement, dollarBillsYall);
    }

    interpolated = insertReplacement(
      interpolated,
      new RegExp(`%\\{${arg}\\}`, "g"),
      replacement
    );
  }

  return interpolated;
}

const defaultOnMissingKey = (key) => {
  throw new Error(`missing string: ${key}`);
};

export default class Translator {
  constructor(locales, { onMissingKey = defaultOnMissingKey } = {}) {
    this.locale = {
      strings: {},
      pluralize(n) {
        return n === 1 ? 0 : 1;
      },
    };

    if (Array.isArray(locales)) {
      locales.forEach((locale) => this.apply(locale));
    } else {
      this.apply(locales);
    }

    this.onMissingKey = onMissingKey;
  }

  translate(key, options) {
    return this.translateArray(key, options).join("");
  }

  translateArray(key, options) {
    let string = this.locale.strings[key];

    if (string == null) {
      this.onMissingKey?.(key);
      string = key;
    }

    if (typeof string === "object") {
      if (options && typeof options.smart_count !== "undefined") {
        const plural = this.locale.pluralize(options.smart_count);
        return interpolate(string[plural], options);
      }

      throw new Error(
        "Attempted to use a string with plural forms, but no value was given for %{smart_count}"
      );
    }

    if (typeof string !== "string") {
      throw new Error("string was not a string");
    }

    return interpolate(string, options);
  }

  apply(locale) {
    if (!locale?.strings) {
      return;
    }

    const prevLocale = this.locale;
    Object.assign(this.locale, {
      strings: {
        ...prevLocale.strings,
        ...locale.strings,
      },
      pluralize: locale.pluralize || prevLocale.pluralize,
    });
  }
}
