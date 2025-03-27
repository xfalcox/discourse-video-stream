# frozen_string_literal: true

module DiscourseVideoStream
  class Engine < ::Rails::Engine
    engine_name "discourse_video_stream"
    isolate_namespace DiscourseVideoStream
  end
end
