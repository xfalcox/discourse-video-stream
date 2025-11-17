import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";

/**
 * Initialize Shaka Player for a video element
 * @param {HTMLVideoElement} videoElement
 * @param {string} videoId
 * @param {string} customerSubdomain
 */
async function initializeShakaPlayer(videoElement, videoId, customerSubdomain) {
  try {
    // Load Shaka Player library from vendored assets
    await loadScript(
      "/plugins/discourse-video-stream/javascripts/shaka-player.compiled.js"
    );

    // Check if browser is supported
    if (!window.shaka?.Player?.isBrowserSupported()) {
      // eslint-disable-next-line no-console
      console.error("Shaka Player: Browser not supported");
      return;
    }

    // Create player instance
    const player = new window.shaka.Player(videoElement);

    // Build manifest URL - try DASH first, fallback to HLS
    const manifestUri = `https://${customerSubdomain}/${videoId}/manifest/video.mpd`;

    // Load the manifest
    await player.load(manifestUri);

    // Store player instance on video element for cleanup
    videoElement.shakaPlayer = player;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize Shaka Player:", error);
  }
}

/**
 * Initialize video stream players in cooked content
 * @param {object} api
 */
function initializeVideoStreamPlayer(api) {
  const siteSettings = api.container.lookup("service:site-settings");

  api.decorateCookedElement(
    (element) => {
      const containers = element.querySelectorAll(".video-stream-container");

      if (!containers.length) {
        return;
      }

      const customerSubdomain =
        siteSettings.video_stream_customer_subdomain?.trim();

      if (!customerSubdomain) {
        // eslint-disable-next-line no-console
        console.error(
          "Video Stream: customer subdomain not configured in site settings"
        );
        return;
      }

      containers.forEach((container) => {
        // Skip if already initialized
        if (container.querySelector("video")) {
          return;
        }

        const videoId = container.dataset.videoId;

        if (!videoId) {
          return;
        }

        // Create video element
        const video = document.createElement("video");
        video.className = "video-stream-player";
        video.controls = true;
        video.poster = `https://${customerSubdomain}/${videoId}/thumbnails/thumbnail.jpg`;

        // Add video to container
        container.appendChild(video);

        // Initialize Shaka Player
        initializeShakaPlayer(video, videoId, customerSubdomain);
      });
    },
    {
      id: "video-stream-player",
      onlyStream: true,
    }
  );

  // Clean up players on element removal
  api.decorateCookedElement(
    (element) => {
      return () => {
        const videos = element.querySelectorAll(".video-stream-player");
        videos.forEach((video) => {
          if (video.shakaPlayer) {
            video.shakaPlayer.destroy();
          }
        });
      };
    },
    {
      id: "video-stream-player-cleanup",
      onlyStream: true,
    }
  );
}

export default {
  name: "video-stream-player",
  initialize() {
    withPluginApi(initializeVideoStreamPlayer);
  },
};
