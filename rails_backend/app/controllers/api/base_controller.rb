class Api::BaseController < ApplicationController
  # Common error handling
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActionController::ParameterMissing, with: :parameter_missing

  private

  def record_not_found(exception)
    render json: {
      error: "Record not found",
      message: exception.message,
    }, status: :not_found
  end

  def record_invalid(exception)
    render json: {
      error: "Validation failed",
      message: exception.message,
      details: exception.record.errors.full_messages,
    }, status: :unprocessable_entity
  end

  def parameter_missing(exception)
    render json: {
      error: "Missing required parameter",
      message: exception.message,
    }, status: :bad_request
  end

  def render_success(data = {}, status = :ok)
    render json: {
      success: true,
      data: data,
    }, status: status
  end

  def render_error(message, status = :bad_request, details = nil)
    response = {
      success: false,
      error: message,
    }
    response[:details] = details if details.present?

    render json: response, status: status
  end
end
