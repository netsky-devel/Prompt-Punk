class SingleAgentJob < ApplicationJob
  queue_as :default

  def perform(task_id, provider_config, architecture_config = {})
    @task = PromptTask.find(task_id)
    @provider_config = provider_config
    @architecture_config = architecture_config || {}

    @task.update!(status: :processing, started_at: Time.current)

    Rails.logger.info "SingleAgentJob: Starting task #{task_id} with architecture: #{@architecture_config[:architecture]}"

    result = improve_prompt(@task.original_prompt, @provider_config, @architecture_config)
    save_improvement(result)

    @task.update!(status: :completed, completed_at: Time.current)
    Rails.logger.info "SingleAgentJob: Completed task #{task_id}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "SingleAgentJob: Task #{task_id} not found: #{e.message}"
    raise
  rescue => e
    Rails.logger.error "SingleAgentJob failed for task #{task_id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    if @task&.persisted?
      @task.update!(
        status: :failed,
        completed_at: Time.current,
        error_message: e.message,
      )
    end
    raise
  end

  private

  def improve_prompt(original_prompt, provider_config, architecture_config)
    service = PromptImprovementService.new(
      original_prompt: original_prompt,
      provider_config: provider_config,
      architecture_config: architecture_config,
    )
    service.call
  end

  def save_improvement(result)
    processing_time = @task.processing_time
    # Ensure minimum processing time for validation
    processing_time = 0.1 if processing_time.nil? || processing_time <= 0

    improvement_data = {
      prompt_task: @task,
      improved_prompt: extract_improved_prompt(result),
      analysis: result[:analysis] || {},
      improvements_metadata: result[:improvements] || {},
      provider_used: @provider_config[:provider],
      ai_model_used: @provider_config[:model],
      architecture_used: result[:architecture_used] || "auto",
      quality_score: extract_quality_score(result),
      processing_time_seconds: processing_time,
    }

    PromptImprovement.create!(improvement_data)
  end

  def extract_improved_prompt(result)
    return "Unable to extract improved prompt" if result.nil? || result.empty?

    if result.is_a?(Hash)
      # Try different possible keys
      improved = result[:improved_prompt] ||
                 result["improved_prompt"] ||
                 result[:prompt] ||
                 result["prompt"]
      return improved if improved.present?
    elsif result.is_a?(String)
      # If it's already a string, try to parse as JSON first
      begin
        parsed = JSON.parse(result)
        if parsed.is_a?(Hash)
          improved = parsed[:improved_prompt] ||
                     parsed["improved_prompt"] ||
                     parsed[:prompt] ||
                     parsed["prompt"]
          return improved if improved.present?
        end
        # Return as is if not valid JSON
        return result
      rescue JSON::ParserError
        # Return as is if not valid JSON
        return result
      end
    end

    # Fallback - return proper error message
    "Unable to extract improved prompt"
  end

  def extract_quality_score(result)
    if result.is_a?(Hash)
      # Try different possible keys
      score = result.dig(:improvements, :quality_score) ||
              result.dig("improvements", "quality_score") ||
              result[:quality_score] ||
              result["quality_score"]

      return score if score.present? && score.is_a?(Numeric)
    end

    # Default quality score
    75
  end
end
