import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { on } from "@ember/modifier";
import { fn } from "@ember/helper";
import withEventValue from "discourse/helpers/with-event-value";
import DModal from "discourse/components/d-modal";
import DButton from "discourse/components/d-button";
import dIcon from "discourse/helpers/d-icon";
import { i18n } from "discourse-i18n";

export default class VideoUploadModal extends Component {
  @service modal;
  @tracked isUploading = false;
  @tracked uploadProgress = 0;

  constructor() {
    super(...arguments);
  }

  @action
  async uploadVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Get the upload URL from our backend
      const response = await fetch("/video-stream/upload-url.json", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
        }
      });

      if (!response.ok) throw new Error("Failed to get upload URL");
      const result = await response.json();

      // Now upload directly to Cloudflare Stream
      const uploadUrl = result.uploadURL;
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          this.uploadProgress = Math.round(progress);
        }
      };

      // Set up promise to handle the upload
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
      });

      // Start the upload
      xhr.open("POST", uploadUrl, true);
      xhr.send(formData);

      // Wait for upload to complete
      await uploadPromise;

      // Insert the video player iframe into the composer
      const videoEmbed = `\n\n<iframe
        src="https://${this.args.model.customerSubdomain}/${result.uid}/iframe"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowfullscreen="true">
        </iframe>\n\n`;

      this.args.closeModal();
      this.args.model.toolbarEvent.addText(videoEmbed);
      
    } catch (error) {
      console.error("Upload failed:", error);
      const toasts = this.modal.container.lookup("service:toasts");
      toasts.error({
        duration: 3000,
        data: {
          message: "video_stream.upload_failed"
        }
      });
    } finally {
      this.isUploading = false;
      this.uploadProgress = 0;
    }
  }

  <template>
    <DModal
      class="video-upload-modal"
      @title={{i18n "video_stream.upload_video"}}
      @closeModal={{@closeModal}}
    >
      <:body>
        {{#if this.isUploading}}
          <div class="video-stream-upload-progress">
            <div class="progress-bar">
              <div class="progress" style="width: {{this.uploadProgress}}%"></div>
            </div>
            <span class="progress-text">{{i18n "video_stream.upload_progress" progress=this.uploadProgress}}</span>
          </div>
        {{else}}
          <div class="video-upload-content">
            <p>{{i18n "video_stream.upload_description"}}</p>
            <input
              type="file"
              accept="video/*"
              {{on "change" this.uploadVideo}}
              class="btn btn-primary"
            />
          </div>
        {{/if}}
      </:body>

      <:footer>
        {{#unless this.isUploading}}
          <DButton
            class="btn-flat"
            @action={{@closeModal}}
            @label="cancel"
          />
        {{/unless}}
      </:footer>
    </DModal>
  </template>
}