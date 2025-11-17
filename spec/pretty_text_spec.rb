# frozen_string_literal: true

describe PrettyText do
  before { Jobs.run_immediately! }

  context "with video-stream BBCode" do
    before { SiteSetting.video_stream_enabled = true }

    it "converts video-stream BBCode to video container div" do
      markdown = <<~MD
        Check out this video:

        [video-stream id="abc123def456"]

        Pretty cool!
      MD

      cooked = PrettyText.cook(markdown.strip)

      expect(cooked).to include('<div class="video-stream-container"')
      expect(cooked).to include('data-video-id="abc123def456"')
    end

    it "handles video IDs with hyphens and underscores" do
      markdown = '[video-stream id="test_video-123"]'

      cooked = PrettyText.cook(markdown)

      expect(cooked).to include('<div class="video-stream-container"')
      expect(cooked).to include('data-video-id="test_video-123"')
    end

    it "handles multiple video embeds in the same post" do
      markdown = <<~MD
        First video:

        [video-stream id="video1"]

        Second video:

        [video-stream id="video2"]
      MD

      cooked = PrettyText.cook(markdown.strip)

      expect(cooked).to include('data-video-id="video1"')
      expect(cooked).to include('data-video-id="video2"')
      expect(cooked.scan(/<div class="video-stream-container"/).count).to eq(2)
    end

    it "does not process malformed BBCode" do
      markdown = "[video-stream id=abc123]" # Missing quotes

      cooked = PrettyText.cook(markdown)

      expect(cooked).not_to include('<div class="video-stream-container"')
      expect(cooked).to include("[video-stream id=abc123]")
    end

    it "does not process BBCode with invalid characters in ID" do
      markdown = '[video-stream id="test@video"]' # @ is not allowed

      cooked = PrettyText.cook(markdown)

      expect(cooked).not_to include('<div class="video-stream-container"')
    end

    it "preserves surrounding content" do
      markdown = <<~MD
        Here is some text before.

        [video-stream id="abc123"]

        And some text after.
      MD

      cooked = PrettyText.cook(markdown.strip)

      expect(cooked).to include("Here is some text before.")
      expect(cooked).to include('<div class="video-stream-container"')
      expect(cooked).to include("And some text after.")
    end

    it "works inline with other content" do
      markdown = "Watch this: [video-stream id=\"demo123\"] and tell me what you think!"

      cooked = PrettyText.cook(markdown)

      expect(cooked).to include("Watch this:")
      expect(cooked).to include('<div class="video-stream-container"')
      expect(cooked).to include("and tell me what you think!")
    end
  end
end
