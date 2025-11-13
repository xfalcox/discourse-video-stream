import { withPluginApi } from "discourse/lib/plugin-api";
import VideoUploadModal from "../discourse/components/modal/video-upload-modal";

function initializeVideoUploader(api) {
  const modal = api.container.lookup("service:modal");
  const siteSettings = api.container.lookup("service:site-settings");

  api.onToolbarCreate((toolbar) => {
    toolbar.addButton({
      id: "video-uploader",
      group: "extras",
      icon: "video",
      title: "video_stream.upload_video",
      shortcut: "ALT+V",
      sendAction(toolbarEvent) {
        modal.show(VideoUploadModal, {
          model: {
            toolbarEvent,
          },
        });
      },
      condition() {
        return (
          siteSettings.video_stream_enabled &&
          siteSettings.video_stream_customer_subdomain
        );
      },
    });
  });
}

export default {
  name: "video-stream-composer",
  initialize() {
    withPluginApi(initializeVideoUploader);
  },
};
