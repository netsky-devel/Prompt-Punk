# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In development: allow any origin for convenience
    # In production: only allow specific trusted domains
    if Rails.env.development?
      origins "*"  # Allow any origin in development
    else
      origins /https:\/\/.*\.vercel\.app/, "https://your-production-domain.com"
    end

    resource "*",
      headers: %w[Authorization Content-Type Accept X-API-Key X-Requested-With],
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false,  # Set to false when using origins '*'
      max_age: 86400  # Cache preflight for 24 hours
  end
end
