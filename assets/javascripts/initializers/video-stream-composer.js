import { withPluginApi } from "discourse/lib/plugin-api";
import VideoUploadModal from "../discourse/components/modal/video-upload-modal";

function initializeVideoUploader(api) {
  const modal = api.container.lookup("service:modal");
  const siteSettings = api.container.lookup("service:site-settings");

  api.addComposerToolbarPopupMenuOption({
    icon: "video",
    label: "video_stream.upload_video",
    action: (toolbarEvent) => {
      modal.show(VideoUploadModal, {
        model: {
          toolbarEvent,
        },
      });
    },
    condition: () => {
      return (
        siteSettings.video_stream_enabled &&
        siteSettings.video_stream_customer_subdomain
      );
    },
  });
}

export default {
  name: "video-stream-composer",
  initialize() {
    withPluginApi(initializeVideoUploader);
  },
};
