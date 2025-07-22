class MultiAgentJob < ApplicationJob
  queue_as :default

  def perform(task_id, provider_config, architecture_config = {})
    Rails.logger.info "MultiAgentJob: Starting multi-agent improvement for task #{task_id}"

    task = PromptTask.find(task_id)

    # Merge configs for the service
    merged_config = provider_config.merge(architecture_config)

    # Run multi-agent workflow
    service = MultiAgentService.new(task_id, merged_config)
    service.call

    Rails.logger.info "MultiAgentJob: Multi-agent improvement completed for task #{task_id}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "MultiAgentJob: Task not found - #{e.message}"
    raise
  rescue => e
    Rails.logger.error "MultiAgentJob: Error processing task #{task_id} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    # Update task status to failed
    begin
      task = PromptTask.find(task_id)
      task.update!(status: :failed)
    rescue => update_error
      Rails.logger.error "Failed to update task status: #{update_error.message}"
    end

    raise
  end
end
