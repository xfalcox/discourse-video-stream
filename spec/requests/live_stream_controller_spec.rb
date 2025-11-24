# frozen_string_literal: true

require "rails_helper"

RSpec.describe DiscourseVideoStream::VideoStreamController do
  fab!(:user)

  before do
    SiteSetting.video_stream_enabled = true
    SiteSetting.video_stream_account_id = "test_account"
    SiteSetting.video_stream_api_token = "test_token"
  end

  describe "#create_live_stream" do
    let(:cloudflare_response) do
      {
        result: {
          uid: "live_input_123",
          rtmps: {
            url: "rtmps://live.cloudflare.com:443/live/",
            streamKey: "test_stream_key",
          },
          created: "2024-01-01T00:00:00.000000Z",
        },
      }
    end

    context "when user is logged in and feature is enabled" do
      before do
        sign_in(user)
        stub_request(
          :post,
          "https://api.cloudflare.com/client/v4/accounts/test_account/stream/live_inputs",
        ).to_return(status: 200, body: cloudflare_response.to_json)
      end

      it "creates a live stream and returns credentials" do
        post "/video-stream/create-live-stream.json", params: { name: "Test Stream" }

        expect(response.status).to eq(200)
        json = response.parsed_body
        expect(json["uid"]).to eq("live_input_123")
        expect(json["rtmps_url"]).to eq("rtmps://live.cloudflare.com:443/live/")
        expect(json["rtmps_stream_key"]).to eq("test_stream_key")
      end
    end

    context "when user is not logged in" do
      it "returns 403 Forbidden" do
        post "/video-stream/create-live-stream.json", params: { name: "Test Stream" }
        expect(response.status).to eq(403)
      end
    end

    context "when feature is disabled" do
      before { SiteSetting.video_stream_enabled = false }

      it "returns 404 Not Found" do
        sign_in(user)
        post "/video-stream/create-live-stream.json", params: { name: "Test Stream" }
        expect(response.status).to eq(404)
      end
    end

    context "when Cloudflare API fails" do
      before do
        sign_in(user)
        stub_request(
          :post,
          "https://api.cloudflare.com/client/v4/accounts/test_account/stream/live_inputs",
        ).to_return(status: 500, body: { errors: [{ message: "Server error" }] }.to_json)
      end

      it "returns 422 with error message" do
        post "/video-stream/create-live-stream.json", params: { name: "Test Stream" }

        expect(response.status).to eq(422)
        json = response.parsed_body
        expect(json["errors"]).to include(I18n.t("video_stream.errors.create_live_input"))
      end
    end
  end
end
