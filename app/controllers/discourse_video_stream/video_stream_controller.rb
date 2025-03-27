# frozen_string_literal: true

module DiscourseVideoStream
  class VideoStreamController < ApplicationController
    def upload_url
      result = VideoUploadService.get_upload_url
      render json: result, status: 200
    end
  end
end
