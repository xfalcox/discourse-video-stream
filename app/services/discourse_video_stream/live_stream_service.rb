# frozen_string_literal: true

module DiscourseVideoStream
  class LiveStreamService
    include ::Service::Base

    CF_LIVE_INPUT_PATH =
      "https://api.cloudflare.com/client/v4/accounts/%{account_id}/stream/live_inputs"

    # @!method self.call(name:)
    #   @return [Service::Base::Context]

    params { attribute :name, :string, default: "Discourse Live Stream" }

    model :live_input

    private

    def fetch_live_input(params:)
      account_id = SiteSetting.video_stream_account_id.presence
      api_token = SiteSetting.video_stream_api_token.presence

      if account_id.blank? || api_token.blank?
        context.fail!(error: I18n.t("video_stream.errors.misconfigured"), status: 422)
      end

      url = CF_LIVE_INPUT_PATH % { account_id: account_id }

      payload = { meta: { name: params.name }, recording: { mode: "automatic" } }

      response =
        Faraday.post(
          url,
          payload.to_json,
          { "Authorization" => "Bearer #{api_token}", "Content-Type" => "application/json" },
        )

      if response.status >= 400
        log_failure(response.status, parse_body(response.body))
        context.fail!(error: I18n.t("video_stream.errors.create_live_input"), status: 422)
      end

      body = parse_body(response.body)

      unless body.dig("result", "uid")
        log_failure(response.status, body)
        context.fail!(error: I18n.t("video_stream.errors.create_live_input"), status: 422)
      end

      result = body["result"]

      {
        uid: result["uid"],
        rtmps_url: result.dig("rtmps", "url"),
        rtmps_stream_key: result.dig("rtmps", "streamKey"),
        created: result["created"],
      }
    rescue JSON::ParserError, Faraday::Error => error
      log_exception(error)
      context.fail!(error: I18n.t("video_stream.errors.create_live_input"), status: 422)
    end

    def parse_body(raw_body)
      raw_body.is_a?(String) ? JSON.parse(raw_body) : raw_body
    end

    def log_failure(status, body)
      Rails.logger.error("[VideoStream] Failed to create live input (status=#{status}): #{body}")
    end

    def log_exception(error)
      Rails.logger.error("[VideoStream] Live input request raised #{error.class}: #{error.message}")
    end
  end
end
