# frozen_string_literal: true

module DiscourseVideoStream
  class VideoUploadService
    def self.get_upload_url
      account_id = SiteSetting.video_stream_account_id
      api_token = SiteSetting.video_stream_api_token

      response =
        Faraday.post(
          "https://api.cloudflare.com/client/v4/accounts/#{account_id}/stream/direct_upload",
          { maxDurationSeconds: 300 }.to_json,
          { "Authorization" => "Bearer #{api_token}", "Content-Type" => "application/json" },
        )

      if response.success?
        JSON.parse(response.body)["result"]
      else
        Rails.logger.error("Failed to get upload URL: #{response.body}")
        raise "Failed to get upload URL"
      end
    end
  end
end
