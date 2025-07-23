class MultiAgentJob < ApplicationJob
  queue_as :default

  def perform(task_id, provider_config, architecture_config = {})
    Rails.logger.info "MultiAgentJob: Starting multi-agent improvement for task #{task_id}"

    task = PromptTask.find(task_id)
    
    # Broadcast task started
    broadcast_task_update(task_id, {
      type: 'task_started',
      status: 'in_progress',
      message: 'Multi-agent improvement started',
      progress: 0
    })

    # Merge configs for the service
    merged_config = provider_config.merge(architecture_config)

    # Run multi-agent workflow with progress callbacks
    service = MultiAgentService.new(task_id, merged_config)
    
    # Set up progress callback for the service
    service.on_progress do |step, progress, message|
      broadcast_task_update(task_id, {
        type: 'task_progress',
        status: 'in_progress',
        step: step,
        progress: progress,
        message: message
      })
    end
    
    service.call
    
    # Broadcast completion
    task.reload
    broadcast_task_update(task_id, {
      type: 'task_completed',
      status: task.status,
      progress: 100,
      message: 'Multi-agent improvement completed successfully'
    })

    Rails.logger.info "MultiAgentJob: Multi-agent improvement completed for task #{task_id}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "MultiAgentJob: Task not found - #{e.message}"
    raise
  rescue => e
    Rails.logger.error "MultiAgentJob: Error processing task #{task_id} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    # Update task status to failed with error message
    begin
      task = PromptTask.find(task_id)
      task.update!(
        status: :failed,
        error_message: "#{e.class}: #{e.message}",
        completed_at: Time.current
      )
      
      # Broadcast task failure
      broadcast_task_update(task_id, {
        type: 'task_failed',
        status: 'failed',
        progress: 0,
        message: "Task failed: #{e.message}",
        error: "#{e.class}: #{e.message}"
      })
      
      Rails.logger.info "Task #{task_id} marked as failed with error: #{e.message}"
    rescue => update_error
      Rails.logger.error "Failed to update task status: #{update_error.message}"
    end

    raise
  end

  private

  def broadcast_task_update(task_id, data)
    # Broadcast to specific task channel
    ActionCable.server.broadcast("task_#{task_id}", data)
    
    # Also broadcast to user's general task channel if we have user context
    # For now, we'll use the task_id as a simple identifier
    ActionCable.server.broadcast("user_tasks_#{task_id}", data.merge(task_id: task_id))
    
    Rails.logger.info "🔌 Broadcasted #{data[:type]} for task #{task_id}: #{data[:message]}"
  rescue => broadcast_error
    Rails.logger.error "❌ Failed to broadcast task update: #{broadcast_error.message}"
  end
end
