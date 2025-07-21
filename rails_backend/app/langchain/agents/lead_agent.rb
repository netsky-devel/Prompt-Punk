class LeadAgent
  def initialize(provider_config)
    @provider_config = provider_config
    @ai_provider = create_ai_provider
  end

  def decide(context)
    Rails.logger.info "LeadAgent: Making strategic decision for round #{context[:round]}"

    prompt = build_decision_prompt(context)
    response = @ai_provider.chat(prompt)

    parse_decision_response(response)
  end

  private

  def create_ai_provider
    case @provider_config[:provider]
    when "openai"
      create_openai_provider
    when "anthropic"
      create_anthropic_provider
    when "google"
      create_google_provider
    else
      create_mock_provider
    end
  end

  def create_openai_provider
    require "openai"
    OpenAI::Client.new(
      access_token: @provider_config[:api_key],
      request_timeout: 60,
    )
  end

  def create_anthropic_provider
    require "anthropic"
    Anthropic::Client.new(
      access_token: @provider_config[:api_key],
      request_timeout: 60,
    )
  end

  def create_google_provider
    require "gemini-ai"
    Gemini.new(
      credentials: {
        service: "generative-language-api",
        api_key: @provider_config[:api_key],
      },
      options: {
        model: @provider_config[:model] || "gemini-1.5-pro",
        generation_config: {
          temperature: 0.2,
          max_output_tokens: 1000,
        },
      },
    )
  end

  def create_mock_provider
    MockLeadAgentProvider.new(@provider_config)
  end

  def build_decision_prompt(context)
    system_prompt = <<~PROMPT
      You are the **EXECUTIVE LEAD AGENT** - a world-class strategic decision maker with 20+ years of experience in AI system optimization and team leadership.

      Your expertise includes:
      - Strategic analysis of prompt quality and improvement potential
      - Advanced understanding of AI capability maximization
      - Expert coordination of multi-agent collaborative workflows
      - Proven track record of delivering 300-500% AI performance improvements

      ## YOUR STRATEGIC MISSION (Round #{context[:round]})

      As the **EXECUTIVE DECISION MAKER**, analyze all team inputs and make the **OPTIMAL STRATEGIC DECISION** for this multi-agent improvement workflow:

      ## DECISION-MAKING FRAMEWORK

      ### 1. Quality Assessment Analysis (40%)
      - **Current Prompt Quality**: What is the objective quality level achieved?
      - **Improvement Trajectory**: Are we seeing meaningful progress each round?
      - **Technical Excellence**: Are advanced techniques properly integrated?
      - **Revolutionary Potential**: Does this approach maximize AI potential?

      ### 2. Strategic Workflow Optimization (30%)
      - **Iteration Efficiency**: Is continued iteration likely to yield significant gains?
      - **Resource Optimization**: What is the optimal stopping point for maximum ROI?
      - **Diminishing Returns**: Are we approaching the point of minimal additional benefit?
      - **Team Performance**: How effectively are the Prompt Engineer and Reviewer collaborating?

      ### 3. Market/Production Readiness (20%)
      - **Real-world Application**: Is the current prompt ready for production use?
      - **Scalability Assessment**: Will this work across different contexts and models?
      - **User Experience**: Does this meet the highest standards for end-user value?
      - **Competitive Advantage**: Does this provide significant competitive differentiation?

      ### 4. Innovation & Future-proofing (10%)
      - **Cutting-edge Integration**: Are the latest 2024-2025 techniques properly leveraged?
      - **Future Adaptability**: Will this remain effective as AI models evolve?
      - **Unique Value Proposition**: What makes this approach exceptionally valuable?

      ## STRATEGIC DECISION OPTIONS

      ### APPROVE (Finalize - Quality Exceeds Expectations)
      - Use when: Quality score ≥85 AND significant improvement achieved AND diminishing returns evident
      - Indicates: Revolutionary prompt ready for production deployment
      - Next step: Finalize and deliver exceptional results

      ### CONTINUE (Iterate - High Potential for Further Enhancement)  
      - Use when: Quality score 70-84 OR significant improvement potential identified
      - Indicates: Additional iteration will yield substantial quality gains
      - Next step: Proceed to next round with targeted improvements

      ### RESTART (Strategic Reset - Fundamental Approach Change Needed)
      - Use when: Quality score <70 OR fundamental flaws in approach detected
      - Indicates: Current trajectory unlikely to achieve revolutionary results
      - Next step: Reset with new strategic approach

      ## COLLABORATION CONTEXT
      - Current Round: #{context[:round]}
      - Max Rounds: #{context[:max_rounds] || 5}
      - Original Prompt: #{context[:original_prompt] || "Not provided"}
      - Prompt Engineer's Work: Latest improvement attempt
      - Reviewer's Assessment: Quality analysis and recommendations
      - Previous Decisions: #{context[:previous_decisions] || "First round"}

      ## STRATEGIC SUCCESS METRICS
      - **Quality Target**: Achieve 85+ overall score with revolutionary improvements
      - **Efficiency Target**: Minimize rounds while maximizing quality gains
      - **Innovation Target**: Integrate cutting-edge techniques for competitive advantage
      - **Production Readiness**: Ensure real-world applicability and scalability

      Your response must be JSON:
      {
        "strategic_analysis": {
          "quality_assessment": "Objective analysis of current prompt quality and achievement level",
          "improvement_trajectory": "Assessment of progress direction and momentum",
          "workflow_efficiency": "Analysis of team collaboration effectiveness and iteration value",
          "production_readiness": "Evaluation of real-world deployment suitability"
        },
        "decision": "APPROVE | CONTINUE | RESTART",
        "confidence_level": 95,
        "reasoning": "Detailed strategic rationale for the decision, including specific factors that influenced the choice",
        "next_steps": "If CONTINUE: specific improvement priorities. If APPROVE: deployment recommendations. If RESTART: new strategic approach",
        "expected_outcome": "Quantified prediction of final results (e.g., 400% better response quality, production-ready revolutionary prompt)",
        "risk_assessment": "Potential risks and mitigation strategies for the chosen path"
      }

      **MAKE THE OPTIMAL STRATEGIC DECISION FOR REVOLUTIONARY AI PROMPT EXCELLENCE!**
    PROMPT

    user_content = build_user_content(context)

    format_prompt_for_provider(system_prompt, user_content)
  end

  def build_user_content(context)
    content = []

    content << "**STRATEGIC DECISION - ROUND #{context[:round]}/#{context[:max_rounds]}**"
    content << ""

    # Current review result
    review = context[:review_result]
    content << "**CURRENT REVIEW:**"
    content << "Recommendation: #{review[:recommendation]}"
    content << "Quality Score: #{review[:quality_score]}"
    content << "Reasoning: #{review[:reasoning]}"
    content << ""

    if review[:strengths].present?
      content << "Strengths: #{review[:strengths].join(", ")}"
    end

    if review[:weaknesses].present?
      content << "Weaknesses: #{review[:weaknesses].join(", ")}"
    end

    if review[:suggestions].present?
      content << "Suggestions: #{review[:suggestions].join(", ")}"
    end
    content << ""

    # Session summary
    if context[:session_summary].present?
      summary = context[:session_summary]
      content << "**SESSION PROGRESS:**"
      content << "Progress: #{summary[:progress_percentage]}%"
      content << "Feedback Count: #{summary[:feedback_count]}"

      if summary[:latest_recommendation].present?
        content << "Latest Recommendation: #{summary[:latest_recommendation]}"
      end
      content << ""
    end

    # Recent feedback patterns
    if context[:feedback_history].present?
      content << "**RECENT PATTERNS:**"
      recent_recommendations = context[:feedback_history]
        .last(3)
        .filter { |f| f["agent"] == "reviewer" }
        .map { |f| f["recommendation"] }
        .compact

      if recent_recommendations.any?
        content << "Recent reviewer recommendations: #{recent_recommendations.join(" → ")}"
      end
      content << ""
    end

    content << "Based on this information, make your strategic decision."
    content << "Consider quality standards, remaining rounds, and overall progress."

    content.join("\n")
  end

  def format_prompt_for_provider(system_prompt, user_content)
    case @provider_config[:provider]
    when "openai"
      {
        model: @provider_config[:model] || "gpt-4",
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_content },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }
    when "anthropic"
      {
        model: @provider_config[:model] || "claude-3-sonnet-20240229",
        messages: [
          { role: "user", content: "#{system_prompt}\n\n#{user_content}" },
        ],
        max_tokens: 1000,
      }
    when "google"
      {
        contents: [{
          parts: [{
            text: "#{system_prompt}\n\n#{user_content}",
          }],
        }],
      }
    else
      {
        prompt: "#{system_prompt}\n\n#{user_content}",
        type: "lead_agent",
        context: user_content,
      }
    end
  end

  def parse_decision_response(response)
    response_text = extract_response_text(response)

    Rails.logger.info "LeadAgent response: #{response_text[0..200]}..."

    begin
      parsed = JSON.parse(response_text)

      if parsed.is_a?(Hash) && parsed["action"].present?
        return {
                 action: parsed["action"],
                 reason: parsed["reason"] || "Strategic decision made",
                 confidence: parsed["confidence"] || "medium",
               }
      end
    rescue JSON::ParserError => e
      Rails.logger.warn "Failed to parse LeadAgent JSON: #{e.message}"
    end

    # Fallback parsing
    fallback_parse_response(response_text)
  end

  def extract_response_text(response)
    case @provider_config[:provider]
    when "openai"
      response.dig("choices", 0, "message", "content") || response.to_s
    when "anthropic"
      response.dig("content", 0, "text") || response.to_s
    when "google"
      response.dig("candidates", 0, "content", "parts", 0, "text") || response.to_s
    else
      response.is_a?(String) ? response : response.to_s
    end
  end

  def fallback_parse_response(text)
    # Try to extract decision from text
    action = "continue" # Default

    if text.downcase.include?("approve") && !text.downcase.include?("notes")
      action = "approve"
    elsif text.downcase.include?("reject")
      action = "reject"
    elsif text.downcase.include?("continue")
      action = "continue"
    end

    {
      action: action,
      reason: "Strategic decision based on available information",
      confidence: "medium",
    }
  end
end

# Mock Provider for LeadAgent
class MockLeadAgentProvider
  def initialize(config)
    @config = config
  end

  def chat(params)
    Rails.logger.info "MockLeadAgentProvider: Simulating strategic decision"

    # Extract context for mock decision
    context = params[:context] || ""
    round_info = extract_round_info(context)
    recommendation = extract_recommendation(context)
    quality_score = extract_quality_score(context)

    # Make mock decision based on extracted info
    decision = make_mock_decision(round_info, recommendation, quality_score)

    JSON.generate(decision)
  end

  private

  def extract_round_info(context)
    match = context.match(/ROUND (\d+)\/(\d+)/)
    if match
      { current: match[1].to_i, max: match[2].to_i }
    else
      { current: 1, max: 3 }
    end
  end

  def extract_recommendation(context)
    match = context.match(/Recommendation: (\w+)/)
    match ? match[1] : "APPROVE_WITH_NOTES"
  end

  def extract_quality_score(context)
    match = context.match(/Quality Score: (\d+)/)
    match ? match[1].to_i : 78
  end

  def make_mock_decision(round_info, recommendation, quality_score)
    current_round = round_info[:current]
    max_rounds = round_info[:max]

    # Apply decision logic
    if recommendation == "APPROVE" || quality_score >= 90
      {
        "action" => "approve",
        "reason" => "High quality standards achieved with score of #{quality_score}",
        "confidence" => "high",
      }
    elsif current_round >= max_rounds
      {
        "action" => "approve",
        "reason" => "Maximum rounds reached - accepting best available version",
        "confidence" => "medium",
      }
    elsif recommendation == "REJECT" || quality_score < 50
      {
        "action" => "reject",
        "reason" => "Quality standards not met after review (score: #{quality_score})",
        "confidence" => "high",
      }
    elsif recommendation == "APPROVE_WITH_NOTES" && current_round >= 2
      {
        "action" => "approve",
        "reason" => "Good quality achieved with minor notes after multiple rounds",
        "confidence" => "medium",
      }
    else
      {
        "action" => "continue",
        "reason" => "Opportunity for improvement remains with #{max_rounds - current_round} rounds left",
        "confidence" => "medium",
      }
    end
  end
end
