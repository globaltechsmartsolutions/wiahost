const root = globalThis;

if (typeof root.SharedArrayBuffer === "undefined") {
  root.SharedArrayBuffer = ArrayBuffer;
}

function defineFalseGetter(prototype, propertyName) {
  if (!prototype || Object.getOwnPropertyDescriptor(prototype, propertyName)) {
    return;
  }

  Object.defineProperty(prototype, propertyName, {
    configurable: true,
    get() {
      return false;
    },
  });
}

defineFalseGetter(ArrayBuffer.prototype, "resizable");
defineFalseGetter(root.SharedArrayBuffer?.prototype, "growable");
