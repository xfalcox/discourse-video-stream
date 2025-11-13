/* eslint-disable */
var _uppy = Symbol("uppy");
var _events = Symbol("events");

export default class EventManager {
  constructor(uppy) {
    this[_uppy] = uppy;
    this[_events] = [];
  }

  on(event, fn) {
    this[_events].push([event, fn]);
    return this[_uppy].on(event, fn);
  }

  remove() {
    for (const [event, fn] of this[_events].splice(0)) {
      this[_uppy].off(event, fn);
    }
  }

  onFilePause(fileID, cb) {
    this.on("upload-pause", (file, isPaused) => {
      if (fileID === file?.id) {
        cb(isPaused);
      }
    });
  }

  onFileRemove(fileID, cb) {
    this.on("file-removed", (file) => {
      if (fileID === file.id) {
        cb(file.id);
      }
    });
  }

  onPause(fileID, cb) {
    this.on("upload-pause", (file, isPaused) => {
      if (fileID === file?.id) {
        cb(isPaused);
      }
    });
  }

  onRetry(fileID, cb) {
    this.on("upload-retry", (file) => {
      if (fileID === file?.id) {
        cb();
      }
    });
  }

  onRetryAll(fileID, cb) {
    this.on("retry-all", () => {
      if (!this[_uppy].getFile(fileID)) {
        return;
      }
      cb();
    });
  }

  onPauseAll(fileID, cb) {
    this.on("pause-all", () => {
      if (!this[_uppy].getFile(fileID)) {
        return;
      }
      cb();
    });
  }

  onCancelAll(fileID, eventHandler) {
    this.on("cancel-all", (...args) => {
      if (!this[_uppy].getFile(fileID)) {
        return;
      }
      eventHandler(...args);
    });
  }

  onResumeAll(fileID, cb) {
    this.on("resume-all", () => {
      if (!this[_uppy].getFile(fileID)) {
        return;
      }
      cb();
    });
  }
}
