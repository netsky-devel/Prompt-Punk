class Api::BaseController < ApplicationController
  # Common error handling
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActionController::ParameterMissing, with: :parameter_missing

  protected

  # Simple API key validation for development
  def validate_api_key
    api_key = request.headers["X-API-Key"]

    if api_key.blank?
      render_error("API key is required", :unauthorized)
      return false
    end

    # For development, just check that it's a reasonable format
    # In production, you'd validate against your provider's API
    unless valid_api_key_format?(api_key)
      render_error("Invalid API key format", :unauthorized)
      return false
    end

    true
  end

  def valid_api_key_format?(api_key)
    # Basic format validation for common providers
    api_key.match?(/^(sk-|AIza|sk-ant-)/) && api_key.length > 10
  end

  def current_api_key
    request.headers["X-API-Key"]
  end

  def render_success(data, status = :ok)
    render json: { success: true, data: data }, status: status
  end

  def render_error(message, status = :bad_request, details = nil)
    response = { success: false, error: message }
    response[:details] = details if details
    render json: response, status: status
  end

  private

  def record_not_found(exception)
    render_error("Record not found", :not_found)
  end

  def record_invalid(exception)
    render_error("Validation failed", :unprocessable_entity, exception.record.errors.full_messages)
  end

  def parameter_missing(exception)
    render_error("Missing required parameter: #{exception.param}", :bad_request)
  end
end
