/* eslint-disable */
/* global define, requirejs */

import BasePlugin from "../vendor/@uppy/core/BasePlugin.js";
import EventManager from "../vendor/@uppy/core/EventManager.js";

function registerUppyModule(moduleName, moduleValue) {
  if (requirejs?.entries?.[moduleName]) {
    return;
  }

  define(moduleName, ["exports"], (exports) => {
    exports.default = moduleValue;
  });
}

registerUppyModule("@uppy/core/lib/BasePlugin.js", BasePlugin);
registerUppyModule("@uppy/core/lib/EventManager.js", EventManager);
