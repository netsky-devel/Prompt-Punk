Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      resources :tasks, only: [:create, :show, :index] do
        member do
          get :status
          get :result
        end
        collection do
          get :recent
        end
      end

      resources :providers, only: [:index] do
        collection do
          post :test_connection
        end
      end

      get :health, to: "health#check"
    end
  end

  # Sidekiq Web UI (development only)
  if Rails.env.development?
    require "sidekiq/web"
    mount Sidekiq::Web => "/sidekiq"
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Default health check for API
  get "/" => "api/v1/health#check"
end
