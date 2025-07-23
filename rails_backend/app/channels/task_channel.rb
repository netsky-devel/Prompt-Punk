class TaskChannel < ApplicationCable::Channel
  def subscribed
    # Subscribe to a specific task or all tasks for this user
    task_id = params[:task_id]
    
    if task_id.present?
      # Subscribe to updates for a specific task
      stream_from "task_#{task_id}"
      Rails.logger.info "🔌 TaskChannel: Subscribed to task_#{task_id}"
    else
      # Subscribe to all task updates for this user
      stream_from "user_tasks_#{current_user_id}"
      Rails.logger.info "🔌 TaskChannel: Subscribed to user_tasks_#{current_user_id}"
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    Rails.logger.info "🔌 TaskChannel: Unsubscribed from #{current_user_id}"
  end

  # Handle client-side actions
  def cancel_task(data)
    task_id = data['task_id']
    
    begin
      task = PromptTask.find(task_id)
      
      if task.status == 'in_progress'
        # Cancel the Sidekiq job if it's still running
        if task.job_id.present?
          Sidekiq::Job.new(task.job_id, 'default').delete
        end
        
        task.update!(
          status: 'cancelled',
          error_message: 'Task cancelled by user'
        )
        
        # Broadcast the cancellation to all subscribers
        ActionCable.server.broadcast(
          "task_#{task_id}",
          {
            type: 'task_cancelled',
            task_id: task_id,
            status: 'cancelled',
            message: 'Task cancelled by user'
          }
        )
        
        Rails.logger.info "🚫 TaskChannel: Task #{task_id} cancelled"
      end
    rescue ActiveRecord::RecordNotFound
      Rails.logger.error "❌ TaskChannel: Task #{task_id} not found"
    rescue => e
      Rails.logger.error "❌ TaskChannel: Error cancelling task #{task_id}: #{e.message}"
    end
  end
end
