class MultiAgentJob < ApplicationJob
  queue_as :default

  def perform(task_id, provider_config)
    @task = PromptTask.find(task_id)
    @provider_config = provider_config

    Rails.logger.info "Starting MultiAgent task ##{@task.id}"

    # Update task status to processing
    @task.update!(status: :processing)

    # Create multi-agent session
    @session = MultiAgentSession.create!(
      prompt_task: @task,
      current_round: 0,
      rounds_completed: 0,
      feedback_history: [],
    )

    begin
      # Process multi-agent workflow
      result = orchestrate_agents

      # Save the improvement
      save_improvement(result)

      # Mark task as completed
      @task.update!(status: :completed)

      Rails.logger.info "MultiAgent task ##{@task.id} completed successfully"
    rescue => e
      Rails.logger.error "MultiAgent task ##{@task.id} failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")

      @task.update!(
        status: :failed,
        error_message: e.message,
      )

      # Update session with failure
      @session&.update!(final_decision: "reject")

      raise e
    end
  end

  private

  def orchestrate_agents
    service = MultiAgentService.new(
      task: @task,
      session: @session,
      provider_config: @provider_config,
    )

    service.call
  end

  def save_improvement(result)
    processing_time = @task.processing_time || 0

    improvement_data = {
      prompt_task: @task,
      improved_prompt: result[:final_prompt] || result[:improved_prompt],
      analysis: build_analysis(result),
      improvements_metadata: build_improvements_metadata(result),
      provider_used: @provider_config[:provider],
      ai_model_used: @provider_config[:model],
      architecture_used: "multi_agent",
      quality_score: calculate_quality_score(result),
      processing_time_seconds: processing_time,
    }

    PromptImprovement.create!(improvement_data)
  end

  def build_analysis(result)
    {
      main_goal: "Multi-agent prompt improvement with #{@session.rounds_completed} rounds",
      session_summary: @session.session_summary,
      final_decision: @session.final_decision,
      feedback_count: @session.feedback_count,
      latest_recommendation: @session.latest_recommendation,
      agent_workflow: result[:workflow_summary] || {},
      identified_problems: result[:identified_problems] || [],
      improvement_potential: result[:improvement_potential] || "Collaborative improvement achieved",
    }
  end

  def build_improvements_metadata(result)
    {
      quality_score: calculate_quality_score(result),
      applied_techniques: extract_applied_techniques(result),
      expected_results: extract_expected_results(result),
      multi_agent_metrics: {
        rounds_completed: @session.rounds_completed,
        feedback_interactions: @session.feedback_count,
        final_decision: @session.final_decision,
        session_duration: processing_duration,
        collaboration_quality: assess_collaboration_quality,
      },
    }
  end

  def calculate_quality_score(result)
    base_score = 80 # Multi-agent baseline

    # Bonus for successful completion
    base_score += 10 if @session.approved?

    # Bonus for multiple rounds (shows thoroughness)
    base_score += [@session.rounds_completed * 2, 10].min

    # Penalty for rejection
    base_score -= 15 if @session.rejected?

    # Bonus for quality feedback
    if @session.latest_recommendation == "APPROVE"
      base_score += 5
    elsif @session.latest_recommendation == "APPROVE_WITH_NOTES"
      base_score += 3
    end

    # Ensure score is within bounds
    [[base_score, 100].min, 0].max
  end

  def extract_applied_techniques(result)
    techniques = []

    if @session.feedback_history.present?
      # Analyze feedback for techniques mentioned
      @session.feedback_history.each do |feedback|
        content = feedback["content"] || feedback["feedback"] || ""

        # Look for common technique mentions
        techniques << "Chain-of-Thought" if content.include?("chain") || content.include?("reasoning")
        techniques << "Few-Shot" if content.include?("example") || content.include?("demonstration")
        techniques << "Role-Based" if content.include?("role") || content.include?("persona")
        techniques << "Context-Enhanced" if content.include?("context") || content.include?("background")
      end
    end

    techniques.uniq.presence || ["Multi-Agent Collaboration", "Iterative Refinement"]
  end

  def extract_expected_results(result)
    [
      "Improved prompt clarity through multi-agent review",
      "Enhanced specificity via iterative feedback",
      "Better target audience alignment",
      "Reduced ambiguity through collaborative analysis",
    ]
  end

  def processing_duration
    return nil unless @task.started_at && @task.completed_at
    @task.completed_at - @task.started_at
  end

  def assess_collaboration_quality
    return "poor" if @session.rounds_completed == 0
    return "excellent" if @session.rounds_completed >= 3 && @session.approved?
    return "good" if @session.rounds_completed >= 2
    "acceptable"
  end
end
