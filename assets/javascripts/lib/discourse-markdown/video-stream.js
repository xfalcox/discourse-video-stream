/**
 * Custom BBCode for Cloudflare Stream video embeds
 * Converts [video-stream id="video_id"][/video-stream] to a video container that will be initialized with Shaka Player
 * Supports both inline and block formats
 */

// Validates video ID - allows alphanumeric, hyphens, and underscores only
function isValidVideoId(videoId) {
  return videoId && /^[a-zA-Z0-9_-]+$/.test(videoId);
}

const blockRule = {
  tag: "video-stream",

  wrap(token, tagInfo) {
    const videoId = tagInfo.attrs?.id;

    if (!isValidVideoId(videoId)) {
      return false;
    }

    token.attrs = [
      ["class", "video-stream-container"],
      ["data-video-id", videoId],
    ];

    return true;
  },
};

const inlineRule = {
  tag: "video-stream",

  replace(state, tagInfo) {
    const videoId = tagInfo.attrs?.id;

    if (!isValidVideoId(videoId)) {
      return false;
    }

    let token = state.push("html_inline", "", 0);
    token.content = `<div class="video-stream-container" data-video-id="${videoId}"></div>`;

    return true;
  },
};

export function setup(helper) {
  helper.allowList([
    "div.video-stream-container",
    "div[data-video-id]",
    "video.video-stream-player",
    "video[controls]",
    "video[autoplay]",
    "video[poster]",
  ]);

  helper.registerPlugin((md) => {
    md.block.bbcode.ruler.push("video-stream", blockRule);
    md.inline.bbcode.ruler.push("video-stream", inlineRule);
  });
}
