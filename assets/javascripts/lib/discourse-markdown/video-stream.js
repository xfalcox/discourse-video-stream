/**
 * Custom BBCode for Cloudflare Stream video embeds
 * Converts [video-stream id="video_id"] to a video container that will be initialized with Shaka Player
 */

/**
 * @param {string} text
 */
function addVideoStream(buffer, matches, state) {
  const videoId = matches[1];

  // Create opening tag
  const token = new state.Token("div_open", "div", 1);
  token.attrs = [
    ["class", "video-stream-container"],
    ["data-video-id", videoId],
  ];
  buffer.push(token);

  // Close the div
  const closeToken = new state.Token("div_close", "div", -1);
  buffer.push(closeToken);
}

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
    md.core.textPostProcess.ruler.push("video-stream", {
      matcher: /\[video-stream id="([a-zA-Z0-9_-]+)"\]/,
      onMatch: addVideoStream,
    });
  });
}
