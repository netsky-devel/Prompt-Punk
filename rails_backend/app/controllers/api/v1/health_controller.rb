class Api::V1::HealthController < Api::BaseController
  # GET /api/v1/health
  def check
    data = {
      status: "ok",
      timestamp: Time.current.iso8601,
      version: "1.0.0",
      environment: Rails.env,
      database: database_status,
      redis: redis_status,
      sidekiq: sidekiq_status,
      services: {
        langchain: langchain_status,
        ai_providers: ai_providers_status,
      },
    }

    # Overall health
    all_healthy = [
      data[:database][:healthy],
      data[:redis][:healthy],
      data[:sidekiq][:healthy],
    ].all?

    data[:healthy] = all_healthy

    status_code = all_healthy ? :ok : :service_unavailable
    render json: data, status: status_code
  end

  private

  def database_status
    {
      healthy: ActiveRecord::Base.connection.active?,
      message: "Database connection active",
    }
  rescue => e
    {
      healthy: false,
      message: "Database error: #{e.message}",
    }
  end

  def redis_status
    redis = Redis.new
    redis.ping
    {
      healthy: true,
      message: "Redis connection active",
    }
  rescue => e
    {
      healthy: false,
      message: "Redis error: #{e.message}",
    }
  end

  def sidekiq_status
    # Check if Sidekiq is processing jobs
    stats = Sidekiq::Stats.new
    {
      healthy: true,
      message: "Sidekiq operational",
      enqueued: stats.enqueued,
      processed: stats.processed,
      failed: stats.failed,
      retry_size: stats.retry_size,
    }
  rescue => e
    {
      healthy: false,
      message: "Sidekiq error: #{e.message}",
    }
  end

  def langchain_status
    # Check if LangChain.rb is available
    begin
      require "langchain"
      {
        available: true,
        version: Langchain::VERSION,
      }
    rescue LoadError
      {
        available: false,
        message: "LangChain.rb not available",
      }
    end
  end

  def ai_providers_status
    providers = []

    # Check OpenAI
    begin
      require "openai"
      providers << {
        name: "openai",
        available: true,
        gem_version: OpenAI::VERSION,
      }
    rescue LoadError
      providers << {
        name: "openai",
        available: false,
        message: "OpenAI gem not available",
      }
    end

    # Check Anthropic
    begin
      require "anthropic"
      providers << {
        name: "anthropic",
        available: true,
      }
    rescue LoadError
      providers << {
        name: "anthropic",
        available: false,
        message: "Anthropic gem not available",
      }
    end

    # Check Google Gemini
    begin
      require "gemini-ai"
      providers << {
        name: "gemini",
        available: true,
      }
    rescue LoadError
      providers << {
        name: "gemini",
        available: false,
        message: "Gemini AI gem not available",
      }
    end

    providers
  end
end
