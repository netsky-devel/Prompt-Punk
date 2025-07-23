module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user_id

    def connect
      self.current_user_id = find_verified_user
    end

    private

    def find_verified_user
      # For now, we'll use a simple API key based authentication
      # In a real app, you might want to use JWT or session-based auth
      api_key = request.params[:api_key]
      
      if api_key.present?
        # Simple validation - in production you'd validate against a user table
        api_key
      else
        reject_unauthorized_connection
      end
    end
  end
end
