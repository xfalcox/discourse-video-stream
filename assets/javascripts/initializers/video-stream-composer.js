import { withPluginApi } from "discourse/lib/plugin-api";
import { computed } from "@ember/object";
import VideoUploadModal from "../discourse/components/modal/video-upload-modal";

function initializeVideoUploader(api) {
  const modal = api.container.lookup("service:modal");
  const settings = api.container.lookup("service:site-settings");

  api.onToolbarCreate((toolbar) => {
    toolbar.addButton({
      id: "video-uploader",
      group: "extras",
      icon: "video",
      title: "video_stream.upload_video",
      shortcut: "ALT+V",
      sendAction: (toolbarEvent) => {
        modal.show(VideoUploadModal, {
          model: {
            toolbarEvent: toolbarEvent,
            customerSubdomain: settings.video_stream_customer_subdomain
          }
        });
      },
      condition: () => api.container.lookup("service:site-settings").video_stream_enabled
    });
  });
}

export default {
  name: "video-stream-composer",
  initialize() {
    withPluginApi("1.1.0", initializeVideoUploader);
  }
}; 