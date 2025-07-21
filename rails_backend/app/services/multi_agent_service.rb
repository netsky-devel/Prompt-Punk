# Load agent classes
require_relative "../langchain/agents/prompt_engineer_agent"
require_relative "../langchain/agents/reviewer_agent"
require_relative "../langchain/agents/lead_agent"

class MultiAgentService
  def initialize(task:, session:, provider_config:)
    @task = task
    @session = session
    @provider_config = provider_config
    @max_rounds = @task.max_rounds || 3
  end

  def call
    Rails.logger.info "Starting multi-agent workflow for task ##{@task.id}"

    current_prompt = @task.original_prompt
    round = 1

    while round <= @max_rounds
      Rails.logger.info "Multi-agent Round #{round}/#{@max_rounds}"

      # Update session
      @session.update!(current_round: round)

      # Step 1: Prompt Engineer improves the prompt
      improved_prompt = prompt_engineer_step(current_prompt, round)

      # Step 2: Reviewer analyzes the improvement
      review_result = reviewer_step(@task.original_prompt, improved_prompt, round)

      # Step 3: Lead Agent makes strategic decision
      decision = lead_agent_step(review_result, round)

      # Log round progress
      log_round_progress(round, review_result, decision)

      # Make decision based on Lead Agent's strategic analysis
      decision_action = decision[:decision]&.downcase || decision[:action]&.downcase || "continue"

      case decision_action
      when "approve"
        @session.update!(
          final_decision: "approve",
          rounds_completed: round,
        )

        return build_success_result(improved_prompt, review_result, decision)
      when "restart"
        @session.update!(
          final_decision: "restart",
          rounds_completed: round,
        )

        return build_failure_result(decision)
      when "continue"
        current_prompt = improved_prompt
        round += 1
        next
      end
    end

    # Max rounds reached - approve best version
    @session.update!(
      final_decision: "approve",
      rounds_completed: @max_rounds,
    )

    build_success_result(current_prompt, nil, { decision: "approve", reasoning: "Max rounds reached" })
  end

  private

  def prompt_engineer_step(current_prompt, round)
    Rails.logger.info "Prompt Engineer: Improving prompt (Round #{round})"

    agent = PromptEngineerAgent.new(@provider_config)

    context = {
      original_prompt: @task.original_prompt,
      current_prompt: current_prompt,
      round: round,
      context: @task.context,
      target_audience: @task.target_audience,
      feedback_history: @session.feedback_history,
    }

    result = agent.improve(context)

    # Add to session feedback
    @session.add_feedback(round, "prompt_engineer", {
      action: "improve",
      input_prompt: current_prompt,
      output_prompt: result[:improved_prompt],
      reasoning: result[:reasoning] || "Prompt improvement applied",
      techniques_used: result[:techniques] || [],
    })

    result[:improved_prompt]
  end

  def reviewer_step(original_prompt, improved_prompt, round)
    Rails.logger.info "Reviewer: Analyzing improvement (Round #{round})"

    agent = ReviewerAgent.new(@provider_config)

    context = {
      original_prompt: original_prompt,
      improved_prompt: improved_prompt,
      round: round,
      task_context: @task.context,
      target_audience: @task.target_audience,
    }

    result = agent.review(context)

    # Add to session feedback
    @session.add_feedback(round, "reviewer", {
      action: "review",
      recommendation: result[:recommendation],
      quality_assessment: result[:quality_assessment] || {},
      detailed_analysis: result[:detailed_analysis] || {},
      confidence_level: result[:confidence_level] || 85,
      feedback: result[:feedback] || "",
      expected_impact: result[:expected_impact] || "",
      suggestions: result[:suggestions] || [],
      quality_score: result[:quality_score] || 75,
      reasoning: result[:reasoning] || "Quality review completed",
    })

    result
  end

  def lead_agent_step(review_result, round)
    Rails.logger.info "Lead Agent: Making strategic decision (Round #{round})"

    agent = LeadAgent.new(@provider_config)

    context = {
      round: round,
      max_rounds: @max_rounds,
      review_result: review_result,
      feedback_history: @session.feedback_history,
      session_summary: @session.session_summary,
    }

    result = agent.decide(context)

    # Add to session feedback
    @session.add_feedback(round, "lead_agent", {
      action: "decide",
      decision: result[:decision],
      strategic_analysis: result[:strategic_analysis] || {},
      confidence_level: result[:confidence_level] || 85,
      reasoning: result[:reasoning] || "Strategic decision made",
      next_steps: result[:next_steps] || "",
      expected_outcome: result[:expected_outcome] || "",
      risk_assessment: result[:risk_assessment] || "",
    })

    result
  end

  def log_round_progress(round, review_result, decision)
    Rails.logger.info <<~LOG
                                                                                                                                                                                                                                                                                                                                                            Round #{round} Summary:
      - Review: #{review_result[:recommendation]} (Score: #{review_result[:quality_score]})
      - Decision: #{decision[:action]}
                                                                                                                                                                                                                                                                                                                                                            - Reason: #{decision[:reason]}
                      LOG
  end

  def build_success_result(final_prompt, review_result, decision)
    {
      success: true,
      final_prompt: final_prompt,
      improved_prompt: final_prompt,
      rounds_completed: @session.rounds_completed,
      final_decision: @session.final_decision,
      session_id: @session.id,
      workflow_summary: {
        total_rounds: @session.rounds_completed,
        final_decision: decision[:decision] || decision[:action] || "approve",
        decision_reason: decision[:reasoning] || decision[:reason] || "Multi-agent workflow completed",
        feedback_count: @session.feedback_count,
        collaboration_quality: assess_collaboration_quality,
      },
      identified_problems: extract_identified_problems,
      improvement_potential: "Multi-agent collaboration achieved #{@session.rounds_completed} rounds of refinement",
    }
  end

  def build_failure_result(decision)
    {
      success: false,
      final_prompt: @task.original_prompt,
      improved_prompt: @task.original_prompt,
      rounds_completed: @session.rounds_completed,
      final_decision: @session.final_decision,
      session_id: @session.id,
      error_reason: decision[:reasoning] || decision[:reason] || "Workflow terminated",
      workflow_summary: {
        total_rounds: @session.rounds_completed,
        final_decision: "restart",
        decision_reason: decision[:reasoning] || decision[:reason] || "Strategic reset required",
        feedback_count: @session.feedback_count,
        collaboration_quality: "needs_improvement",
      },
    }
  end

  def assess_collaboration_quality
    return "poor" if @session.rounds_completed == 0
    return "excellent" if @session.rounds_completed >= 3 && @session.approved?
    return "good" if @session.rounds_completed >= 2
    "acceptable"
  end

  def extract_identified_problems
    problems = []

    @session.feedback_history.each do |feedback|
      if feedback["agent"] == "reviewer" && feedback["weaknesses"].present?
        problems.concat(feedback["weaknesses"])
      end
    end

    problems.uniq.presence || ["Original prompt analyzed through multi-agent review"]
  end
end
