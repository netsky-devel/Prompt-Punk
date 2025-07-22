require "langchain"

# Simple wrapper to make Gemini client compatible with LangChain interface
class GeminiLangChainWrapper
  def initialize(gemini_client)
    @client = gemini_client
  end

  def chat(messages:, temperature: 0.7, max_tokens: 2000)
    # Convert LangChain format to Gemini format
    system_message = messages.find { |m| m[:role] == "system" }&.dig(:content) || ""
    user_message = messages.find { |m| m[:role] == "user" }&.dig(:content) || ""

    # Combine system and user messages for Gemini
    combined_prompt = system_message.empty? ? user_message : "#{system_message}\n\n#{user_message}"

    # Call Gemini API
    response = @client.stream_generate_content({
      contents: {
        role: "user",
        parts: {
          text: combined_prompt,
        },
      },
    })

    # Extract text from response
    content = extract_content_from_response(response)

    # Return in LangChain-compatible format
    OpenStruct.new(
      chat_completion: {
        "choices" => [
          {
            "message" => {
              "content" => content,
            },
          },
        ],
      },
      completion: content,
    )
  end

  private

  def extract_content_from_response(response)
    if response.is_a?(Array)
      # Handle streaming response
      response.map { |chunk|
        chunk.dig("candidates", 0, "content", "parts", 0, "text")
      }.compact.join("")
    else
      # Handle single response
      response.dig("candidates", 0, "content", "parts", 0, "text") || response.to_s
    end
  end
end

class MultiAgentService
  def initialize(task_id, provider_config)
    @task = PromptTask.find(task_id)
    @provider_config = provider_config
    @max_rounds = @task.max_rounds || 5
    @session = find_or_create_session

    # Create LangChain AI provider
    @ai_provider = create_langchain_provider
  end

  def call
    Rails.logger.info "MultiAgentService: Starting collaboration for task #{@task.id}"
    @task.update!(status: :processing, started_at: Time.current)

    current_prompt = @task.original_prompt
    final_improvement = nil

    (1..@max_rounds).each do |round|
      Rails.logger.info "=== ROUND #{round}/#{@max_rounds} ==="

      # Step 1: Prompt Engineer improves the prompt
      improvement_result = prompt_engineer_step(current_prompt, round)
      improved_prompt = improvement_result["improved_prompt"] || improvement_result[:improved_prompt]

      # Step 2: Reviewer analyzes the improvement
      review_result = reviewer_step(@task.original_prompt, improved_prompt, round)

      # Step 3: Lead Agent makes strategic decision
      decision_result = lead_agent_step(review_result, round)
      decision = decision_result["decision"] || decision_result[:decision] || "continue"

      # Update session with round results
      update_session_round(round, improvement_result, review_result, decision_result)

      case decision.downcase
      when "approve"
        Rails.logger.info "✅ APPROVED: Prompt meets quality standards"
        final_improvement = improvement_result
        break
      when "restart"
        Rails.logger.info "🔄 RESTART: Starting fresh approach"
        current_prompt = @task.original_prompt
        next
      else # "continue"
        Rails.logger.info "⏭️  CONTINUE: Proceeding to next round"
        current_prompt = improved_prompt
        final_improvement = improvement_result
      end
    end

    # Save final results
    save_results(final_improvement || {})
    Rails.logger.info "MultiAgentService: Collaboration completed"
  rescue => e
    Rails.logger.error "MultiAgentService error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    @task.update!(status: :failed)
    raise
  end

  private

  def create_langchain_provider
    case @provider_config[:provider]
    when "openai"
      Langchain::LLM::OpenAI.new(api_key: @provider_config[:api_key])
    when "anthropic"
      Langchain::LLM::Anthropic.new(api_key: @provider_config[:api_key])
    when "google"
      # Use direct Gemini client with our wrapper
      create_direct_gemini_client
    else
      raise ArgumentError, "Unsupported provider: #{@provider_config[:provider]}. Supported: openai, anthropic, google"
    end
  end

  def create_direct_gemini_client
    require "gemini-ai"

    client = Gemini.new(
      credentials: {
        service: "generative-language-api",
        api_key: @provider_config[:api_key],
      },
      options: {
        model: @provider_config[:model] || "gemini-1.5-pro",
        generation_config: {
          temperature: 0.7,
          max_output_tokens: 2000,
        },
      },
    )

    # Simple wrapper to match LangChain interface
    GeminiLangChainWrapper.new(client)
  end

  def prompt_engineer_step(current_prompt, round)
    Rails.logger.info "Prompt Engineer: Improving prompt (Round #{round})"

    agent = Langchain::Agents::PromptEngineerAgent.new(@ai_provider)
    prompt_content = build_prompt_engineer_content(current_prompt, round)
    result = agent.call(prompt_content)

    Rails.logger.info "Prompt Engineer: Generated improvement"
    result
  end

  def reviewer_step(original_prompt, improved_prompt, round)
    Rails.logger.info "Reviewer: Analyzing improvement (Round #{round})"

    agent = Langchain::Agents::ReviewerAgent.new(@ai_provider)
    review_content = build_reviewer_content(original_prompt, improved_prompt, round)
    result = agent.call(review_content)

    Rails.logger.info "Reviewer: Generated analysis"
    result
  end

  def lead_agent_step(review_result, round)
    Rails.logger.info "Lead Agent: Making strategic decision (Round #{round})"

    agent = Langchain::Agents::LeadAgent.new(@ai_provider)
    decision_content = build_lead_agent_content(review_result, round)
    result = agent.call(decision_content)

    Rails.logger.info "Lead Agent: Generated decision"
    result
  end

  def build_prompt_engineer_content(current_prompt, round)
    content = []
    content << "**ROUND #{round} IMPROVEMENT TASK**"
    content << ""
    content << "**ORIGINAL PROMPT:**"
    content << @task.original_prompt
    content << ""
    content << "**CURRENT VERSION:**"
    content << current_prompt
    content << ""

    if @task.context.present?
      content << "**CONTEXT:**"
      content << @task.context
      content << ""
    end

    if @task.target_audience.present?
      content << "**TARGET AUDIENCE:**"
      content << @task.target_audience
      content << ""
    end

    content << "Please improve this prompt following your expertise and return the result in JSON format."
    content.join("\n")
  end

  def build_reviewer_content(original_prompt, improved_prompt, round)
    content = []
    content << "**ROUND #{round} REVIEW TASK**"
    content << ""
    content << "**ORIGINAL PROMPT:**"
    content << original_prompt
    content << ""
    content << "**IMPROVED VERSION:**"
    content << improved_prompt
    content << ""

    if @task.context.present?
      content << "**TASK CONTEXT:**"
      content << @task.context
      content << ""
    end

    if @task.target_audience.present?
      content << "**TARGET AUDIENCE:**"
      content << @task.target_audience
      content << ""
    end

    content << "Please analyze the improvement and provide your assessment in JSON format."
    content.join("\n")
  end

  def build_lead_agent_content(review_result, round)
    content = []
    content << "**ROUND #{round} STRATEGIC DECISION**"
    content << ""
    content << "**REVIEW RESULTS:**"
    content << review_result.to_json
    content << ""
    content << "**SESSION CONTEXT:**"
    content << "Round: #{round}/#{@max_rounds}"
    content << "Previous rounds: #{@session.rounds_completed}"
    content << ""
    content << "Please make your strategic decision in JSON format."
    content.join("\n")
  end

  def find_or_create_session
    @task.multi_agent_session || @task.create_multi_agent_session!(
      current_round: 0,
      rounds_completed: 0,
      feedback_history: {},
      session_metadata: {},
    )
  end

  def update_session_round(round, improvement_result, review_result, decision_result)
    feedback_data = @session.feedback_history || {}
    feedback_data[round.to_s] = {
      improvement: improvement_result,
      review: review_result,
      decision: decision_result,
      timestamp: Time.current.iso8601,
    }

    @session.update!(
      current_round: round,
      rounds_completed: round,
      feedback_history: feedback_data,
    )
  end

  def save_results(improvement_result)
    if improvement_result.present? && improvement_result["improved_prompt"]
      # Parse response if it's a JSON string
      result = improvement_result.is_a?(String) ? JSON.parse(improvement_result) : improvement_result

      @task.create_prompt_improvement!(
        improved_prompt: result["improved_prompt"],
        analysis: result["analysis"] || {},
        improvements_metadata: result["improvements_metadata"] || {},
        provider_used: @provider_config[:provider],
        ai_model_used: @provider_config[:model] || "unknown",
        architecture_used: @provider_config[:architecture] || "auto",
        quality_score: result.dig("improvements_metadata", "quality_score") || 5,
        processing_time_seconds: (Time.current - @task.started_at).to_i,
      )

      @task.update!(
        status: :completed,
        completed_at: Time.current,
        processing_time: (Time.current - @task.started_at).to_i,
      )

      Rails.logger.info "✅ Results saved successfully"
    else
      @task.update!(status: :failed)
      Rails.logger.error "❌ No valid improvement result to save"
    end
  rescue JSON::ParserError => e
    Rails.logger.error "JSON parsing error in save_results: #{e.message}"
    @task.update!(status: :failed)
  end
end
