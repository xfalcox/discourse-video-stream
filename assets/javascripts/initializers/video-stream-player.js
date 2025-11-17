import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";

/**
 * Initialize Shaka Player for a video element
 * @param {HTMLElement} container - The video container element
 * @param {string} videoId
 * @param {string} customerSubdomain
 */
async function initializeShakaPlayer(container, videoId, customerSubdomain) {
  try {
    // Load Shaka Player UI library (includes base player + UI) and CSS from vendored assets
    await Promise.all([
      loadScript(
        "/plugins/discourse-video-stream/javascripts/shaka-player.ui.js"
      ),
      loadScript(
        "/plugins/discourse-video-stream/stylesheets/shaka-player.ui.css",
        { css: true }
      ),
    ]);

    // Check if browser is supported
    if (!window.shaka?.Player?.isBrowserSupported()) {
      // eslint-disable-next-line no-console
      console.error("Shaka Player: Browser not supported");
      return;
    }

    const videoElement = container.querySelector("video");
    if (!videoElement) {
      return;
    }

    // Create player instance and attach to video element
    const player = new window.shaka.Player();
    await player.attach(videoElement);

    // Create UI instance with the video element and container
    const ui = new window.shaka.ui.Overlay(player, container, videoElement);

    // Configure UI controls to match Shaka Player demo layout
    // This follows the same pattern as https://shaka-player-demo.appspot.com
    const config = {
      addBigPlayButton: true,
      addSeekBar: true,
      // Control bar layout matching the demo
      controlPanelElements: [
        "play_pause",
        "mute",
        "volume",
        "time_and_duration",
        "spacer",
        "overflow_menu",
        "fullscreen",
      ],
      // Overflow menu with quality and playback rate
      overflowMenuButtons: [
        "captions",
        "quality", // Resolution selection
        "language",
        "playback_rate", // Playback speed
        "picture_in_picture",
        "cast",
      ],
      // Enable keyboard shortcuts (space = play/pause, arrows = seek, etc.)
      enableKeyboardPlaybackControls: true,
    };

    ui.configure(config);

    // Try DASH manifest first, fallback to HLS if it fails
    const dashManifestUri = `https://${customerSubdomain}/${videoId}/manifest/video.mpd`;
    const hlsManifestUri = `https://${customerSubdomain}/${videoId}/manifest/video.m3u8`;

    try {
      await player.load(dashManifestUri);
    } catch (dashError) {
      // eslint-disable-next-line no-console
      console.warn("DASH manifest failed, trying HLS:", dashError);
      try {
        await player.load(hlsManifestUri);
      } catch (hlsError) {
        // eslint-disable-next-line no-console
        console.error("Both DASH and HLS manifests failed:", {
          dash: dashError,
          hls: hlsError,
        });
        // Show error message in the video container
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; padding: 2em; text-align: center; color: var(--primary-medium);">
            <div>
              <p>Failed to load video</p>
              <p style="font-size: 0.9em; margin-top: 0.5em;">Video ID: ${videoId}</p>
            </div>
          </div>
        `;
        return;
      }
    }

    // Store player and ui instances on container for cleanup
    container.shakaPlayer = player;
    container.shakaUI = ui;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize Shaka Player:", error);
    // Show generic error message
    if (container) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; padding: 2em; text-align: center; color: var(--primary-medium);">
          <div>
            <p>Failed to initialize video player</p>
            <p style="font-size: 0.9em; margin-top: 0.5em;">Please check the console for details</p>
          </div>
        </div>
      `;
    }
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

        // Create video element (Shaka UI will manage controls)
        const video = document.createElement("video");
        video.className = "video-stream-player";
        video.poster = `https://${customerSubdomain}/${videoId}/thumbnails/thumbnail.jpg`;

        // Add video to container
        container.appendChild(video);

        // Initialize Shaka Player with UI
        initializeShakaPlayer(container, videoId, customerSubdomain);
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
        const containers = element.querySelectorAll(".video-stream-container");
        containers.forEach((container) => {
          if (container.shakaPlayer) {
            container.shakaPlayer.destroy();
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
