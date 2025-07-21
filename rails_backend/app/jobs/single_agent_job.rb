class SingleAgentJob < ApplicationJob
  queue_as :default

  def perform(task_id, provider_config)
    @task = PromptTask.find(task_id)
    @provider_config = provider_config

    Rails.logger.info "Starting SingleAgent task ##{@task.id}"

    # Update task status to processing
    @task.update!(status: :processing)

    begin
      # Process the prompt improvement
      result = improve_prompt

      # Save the improvement
      save_improvement(result)

      # Mark task as completed
      @task.update!(status: :completed)

      Rails.logger.info "SingleAgent task ##{@task.id} completed successfully"
    rescue => e
      Rails.logger.error "SingleAgent task ##{@task.id} failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")

      @task.update!(
        status: :failed,
        error_message: e.message,
      )

      raise e
    end
  end

  private

  def improve_prompt
    service = PromptImprovementService.new(
      original_prompt: @task.original_prompt,
      provider_config: @provider_config,
      context: @task.context,
      target_audience: @task.target_audience,
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
    # Handle different response formats
    if result.is_a?(Hash)
      if result[:improved_prompt].present?
        return result[:improved_prompt]
      elsif result["improved_prompt"].present?
        return result["improved_prompt"]
      end
    elsif result.is_a?(String)
      # Try to parse as JSON
      begin
        parsed = JSON.parse(result)
        return parsed["improved_prompt"] if parsed.is_a?(Hash)
      rescue JSON::ParserError
        # Return as is if not valid JSON
        return result
      end
    end

    # Fallback
    result.to_s
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
