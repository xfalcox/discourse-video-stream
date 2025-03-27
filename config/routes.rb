# frozen_string_literal: true

DiscourseVideoStream::Engine.routes.draw do
  post "/video-stream/upload-url" => "video_stream#upload_url"
end

Discourse::Application.routes.draw { mount ::DiscourseVideoStream::Engine, at: "/" }
