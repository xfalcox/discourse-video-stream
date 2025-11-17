/**
 * Custom BBCode for Cloudflare Stream video embeds
 * Converts [video-stream id="video_id"] to a video container that will be initialized with Shaka Player
 */

function addVideoStream(buffer, matches, state) {
  const videoId = matches[1];

  let token = new state.Token("div_open", "div", 1);
  token.attrs = [
    ["class", "video-stream-container"],
    ["data-video-id", videoId],
  ];
  buffer.push(token);

  token = new state.Token("div_close", "div", -1);
  buffer.push(token);
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
    const rule = {
      matcher: /\[video-stream id="([a-zA-Z0-9_-]+)"\]/,
      onMatch: addVideoStream,
    };

    md.core.textPostProcess.ruler.push("video-stream", rule);
  });
}
