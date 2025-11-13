/* eslint-disable */
/* eslint-disable class-methods-use-this */

import Translator from "../utils/Translator.js";

export default class BasePlugin {
  constructor(uppy, opts) {
    this.uppy = uppy;
    this.opts = opts ?? {};
  }

  getPluginState() {
    const { plugins } = this.uppy.getState();
    return plugins?.[this.id] || {};
  }

  setPluginState(update) {
    const { plugins } = this.uppy.getState();

    this.uppy.setState({
      plugins: {
        ...plugins,
        [this.id]: {
          ...plugins[this.id],
          ...update,
        },
      },
    });
  }

  setOptions(newOpts) {
    this.opts = {
      ...this.opts,
      ...newOpts,
    };

    this.setPluginState(undefined);
    this.i18nInit();
  }

  i18nInit() {
    const translator = new Translator([
      this.defaultLocale,
      this.uppy.locale,
      this.opts.locale,
    ]);

    this.i18n = translator.translate.bind(translator);
    this.i18nArray = translator.translateArray.bind(translator);
    this.setPluginState(undefined);
  }

  addTarget(_plugin) {
    throw new Error("Extend the addTarget method to add your plugin to another plugin's target");
  }

  install() {}
  uninstall() {}
  update(_state) {}
  afterUpdate() {}
}
