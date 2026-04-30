"use strict";

// Metro-safe compatibility shim for EAS Android builds.
// It keeps this dependency inside the mobile app instead of resolving pnpm's
// internal store path, which can fail SHA generation in remote Linux builds.

const conversions = {};

function sign(value) {
  return value < 0 ? -1 : 1;
}

function evenRound(value) {
  if (value % 1 === 0.5 && (value & 1) === 0) {
    return Math.floor(value);
  }

  return Math.round(value);
}

function createNumberConversion(bitLength, typeOptions) {
  let effectiveBitLength = bitLength;

  if (!typeOptions.unsigned) {
    effectiveBitLength -= 1;
  }

  const lowerBound = typeOptions.unsigned ? 0 : -Math.pow(2, effectiveBitLength);
  const upperBound = Math.pow(2, effectiveBitLength) - 1;
  const moduloBitLength = typeOptions.moduloBitLength ?? effectiveBitLength;
  const moduloValue = Math.pow(2, moduloBitLength);
  const moduloBound = Math.pow(2, moduloBitLength - 1);

  return function convertNumber(value, options = {}) {
    let numericValue = +value;

    if (options.enforceRange) {
      if (!Number.isFinite(numericValue)) {
        throw new TypeError("Argument is not a finite number");
      }

      numericValue = sign(numericValue) * Math.floor(Math.abs(numericValue));

      if (numericValue < lowerBound || numericValue > upperBound) {
        throw new TypeError("Argument is outside the expected numeric range");
      }

      return numericValue;
    }

    if (!Number.isNaN(numericValue) && options.clamp) {
      numericValue = evenRound(numericValue);

      if (numericValue < lowerBound) {
        return lowerBound;
      }

      if (numericValue > upperBound) {
        return upperBound;
      }

      return numericValue;
    }

    if (!Number.isFinite(numericValue) || numericValue === 0) {
      return 0;
    }

    numericValue = sign(numericValue) * Math.floor(Math.abs(numericValue));
    numericValue %= moduloValue;

    if (!typeOptions.unsigned && numericValue >= moduloBound) {
      return numericValue - moduloValue;
    }

    if (typeOptions.unsigned && numericValue < 0) {
      return numericValue + moduloValue;
    }

    return Object.is(numericValue, -0) ? 0 : numericValue;
  };
}

conversions.void = function convertVoid() {
  return undefined;
};

conversions.boolean = function convertBoolean(value) {
  return Boolean(value);
};

conversions.byte = createNumberConversion(8, { unsigned: false });
conversions.octet = createNumberConversion(8, { unsigned: true });
conversions.short = createNumberConversion(16, { unsigned: false });
conversions["unsigned short"] = createNumberConversion(16, { unsigned: true });
conversions.long = createNumberConversion(32, { unsigned: false });
conversions["unsigned long"] = createNumberConversion(32, { unsigned: true });
conversions["long long"] = createNumberConversion(32, {
  moduloBitLength: 64,
  unsigned: false,
});
conversions["unsigned long long"] = createNumberConversion(32, {
  moduloBitLength: 64,
  unsigned: true,
});

conversions.double = function convertDouble(value) {
  const numericValue = +value;

  if (!Number.isFinite(numericValue)) {
    throw new TypeError("Argument is not a finite floating-point value");
  }

  return numericValue;
};

conversions["unrestricted double"] = function convertUnrestrictedDouble(value) {
  const numericValue = +value;

  if (Number.isNaN(numericValue)) {
    throw new TypeError("Argument is NaN");
  }

  return numericValue;
};

conversions.float = conversions.double;
conversions["unrestricted float"] = conversions["unrestricted double"];

conversions.DOMString = function convertDOMString(value, options = {}) {
  if (options.treatNullAsEmptyString && value === null) {
    return "";
  }

  return String(value);
};

conversions.ByteString = function convertByteString(value) {
  const stringValue = String(value);

  for (let index = 0; index < stringValue.length; index += 1) {
    const codePoint = stringValue.codePointAt(index);

    if (codePoint !== undefined && codePoint > 255) {
      throw new TypeError("Argument is not a valid ByteString");
    }
  }

  return stringValue;
};

conversions.USVString = function convertUSVString(value) {
  const stringValue = String(value);
  const output = [];

  for (let index = 0; index < stringValue.length; index += 1) {
    const codeUnit = stringValue.charCodeAt(index);

    if (codeUnit < 0xd800 || codeUnit > 0xdfff) {
      output.push(String.fromCodePoint(codeUnit));
      continue;
    }

    if (codeUnit >= 0xdc00) {
      output.push(String.fromCodePoint(0xfffd));
      continue;
    }

    if (index === stringValue.length - 1) {
      output.push(String.fromCodePoint(0xfffd));
      continue;
    }

    const nextCodeUnit = stringValue.charCodeAt(index + 1);

    if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
      const high = codeUnit & 0x3ff;
      const low = nextCodeUnit & 0x3ff;
      output.push(String.fromCodePoint((2 << 15) + (2 << 9) * high + low));
      index += 1;
    } else {
      output.push(String.fromCodePoint(0xfffd));
    }
  }

  return output.join("");
};

conversions.Date = function convertDate(value) {
  if (!(value instanceof Date)) {
    throw new TypeError("Argument is not a Date object");
  }

  return Number.isNaN(value.getTime()) ? undefined : value;
};

conversions.RegExp = function convertRegExp(value) {
  return value instanceof RegExp ? value : new RegExp(value);
};

module.exports = conversions;
