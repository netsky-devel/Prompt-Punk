class ReviewerAgent
  def initialize(provider_config)
    @provider_config = provider_config
    @ai_provider = create_ai_provider
  end

  def review(context)
    Rails.logger.info "ReviewerAgent: Analyzing prompt quality for round #{context[:round]}"

    prompt = build_review_prompt(context)
    response = @ai_provider.chat(prompt)

    parse_review_response(response)
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
          temperature: 0.3,
          max_output_tokens: 1500,
        },
      },
    )
  end

  def create_mock_provider
    MockReviewerProvider.new(@provider_config)
  end

  def build_review_prompt(context)
    system_prompt = <<~PROMPT
      You are a **WORLD-CLASS PROMPT QUALITY ANALYST** with 15+ years of experience in AI system optimization and prompt effectiveness evaluation.

      Your expertise includes:
      - Advanced psycholinguistic analysis and cognitive load assessment
      - Deep knowledge of prompt engineering effectiveness metrics
      - Mastery of persuasion psychology and behavioral triggers
      - Extensive experience in Fortune 500 AI system evaluations

      ## YOUR CRITICAL MISSION (Round #{context[:round]})

      As the **EXPERT REVIEWER** in this elite multi-agent team, conduct a **COMPREHENSIVE QUALITY ANALYSIS** of the Prompt Engineer's work:

      ## ADVANCED EVALUATION FRAMEWORK

      ### 1. Technical Excellence Assessment (30%)
      - **Clarity & Specificity**: Are instructions crystal clear and unambiguous?
      - **Structure Quality**: Does the prompt follow logical organization patterns?
      - **Completeness**: Are all necessary elements present for optimal AI response?
      - **Context Sufficiency**: Is enough background provided for accurate understanding?

      ### 2. Advanced Technique Integration (30%)
      - **EmotionPrompting**: Are emotional stimuli effectively integrated?
      - **Chain-of-Thought**: Is logical reasoning properly structured?
      - **Meta-cognitive Elements**: Are self-reflection prompts included?
      - **Cutting-edge 2024-2025**: Are latest techniques properly applied?
      - **Psychological Triggers**: Are influence techniques appropriately used?

      ### 3. Effectiveness Prediction (25%)
      - **Response Quality Potential**: Will this produce 3-5x better results?
      - **Ambiguity Elimination**: Are all potential misinterpretations removed?
      - **Action-oriented Design**: Does it guide AI toward specific, valuable outputs?
      - **Scalability**: Will this work across different contexts and AI models?

      ### 4. Innovation & Creativity (15%)
      - **Novel Approaches**: Are creative prompt engineering solutions used?
      - **Cutting-edge Integration**: Are latest 2024-2025 techniques properly leveraged?
      - **Unique Value**: What makes this prompt exceptional vs. standard approaches?

      ## COLLABORATION CONTEXT
      - Original Prompt: #{context[:original_prompt] || "Not provided"}
      - Current Round: #{context[:round]}
      - Previous Feedback: #{context[:previous_feedback] || "First round"}
      - Prompt Engineer's Latest Work: Will be provided in user content

      ## QUALITY SCORING RUBRIC
      - **90-100**: Revolutionary - Dramatically exceeds expectations
      - **80-89**: Excellent - Significant improvements with advanced techniques  
      - **70-79**: Good - Solid improvements but missing some advanced elements
      - **60-69**: Acceptable - Basic improvements, needs more sophistication
      - **50-59**: Needs Work - Limited improvements, major gaps remain
      - **Below 50**: Inadequate - Requires substantial rework

      ## CRITICAL ANALYSIS REQUIREMENTS

      1. **MEASURABLE IMPACT**: Provide specific metrics for expected improvements
      2. **TECHNIQUE VALIDATION**: Verify proper application of advanced methods
      3. **GAP IDENTIFICATION**: Identify missing elements that could enhance quality
      4. **ACTIONABLE FEEDBACK**: Give precise, implementable recommendations

      Your response must be JSON:
      {
        "quality_assessment": {
          "overall_score": 85,
          "technical_excellence": 90,
          "technique_integration": 80,
          "effectiveness_prediction": 85,
          "innovation_creativity": 80
        },
        "detailed_analysis": {
          "strengths": ["List specific strengths with examples"],
          "identified_issues": ["Specific problems that need addressing"],
          "missing_elements": ["Advanced techniques that should be added"],
          "improvement_opportunities": ["Specific ways to enhance the prompt"]
        },
        "recommendation": "APPROVE_WITH_NOTES | NEEDS_REVISION | APPROVE",
        "confidence_level": 95,
        "feedback": "Detailed, actionable feedback for the Prompt Engineer focusing on specific improvements",
        "expected_impact": "Quantified prediction of response quality improvement (e.g., 250% better clarity, 400% more actionable)"
      }

      **CONDUCT WORLD-CLASS ANALYSIS THAT ENSURES REVOLUTIONARY PROMPT QUALITY!**
    PROMPT

    user_content = build_user_content(context)

    format_prompt_for_provider(system_prompt, user_content)
  end

  def build_user_content(context)
    content = []

    content << "**ROUND #{context[:round]} REVIEW**"
    content << ""

    content << "**ORIGINAL PROMPT:**"
    content << context[:original_prompt]
    content << ""

    content << "**IMPROVED VERSION:**"
    content << context[:improved_prompt]
    content << ""

    if context[:task_context].present?
      content << "**TASK CONTEXT:**"
      content << context[:task_context]
      content << ""
    end

    if context[:target_audience].present?
      content << "**TARGET AUDIENCE:**"
      content << context[:target_audience]
      content << ""
    end

    content << "Please analyze the improvement and provide your assessment in JSON format."
    content << "Focus on whether the changes enhance clarity, specificity, and effectiveness."

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
        temperature: 0.3,
        max_tokens: 1500,
      }
    when "anthropic"
      {
        model: @provider_config[:model] || "claude-3-sonnet-20240229",
        messages: [
          { role: "user", content: "#{system_prompt}\n\n#{user_content}" },
        ],
        max_tokens: 1500,
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
        type: "reviewer",
        context: user_content,
      }
    end
  end

  def parse_review_response(response)
    response_text = extract_response_text(response)

    Rails.logger.info "Reviewer response: #{response_text[0..200]}..."

    begin
      parsed = JSON.parse(response_text)

      if parsed.is_a?(Hash) && parsed["recommendation"].present?
        return {
                 recommendation: parsed["recommendation"],
                 quality_score: parsed["quality_score"] || calculate_default_score(parsed["recommendation"]),
                 strengths: parsed["strengths"] || [],
                 weaknesses: parsed["weaknesses"] || [],
                 suggestions: parsed["suggestions"] || [],
                 reasoning: parsed["reasoning"] || "Quality assessment completed",
               }
      end
    rescue JSON::ParserError => e
      Rails.logger.warn "Failed to parse Reviewer JSON: #{e.message}"
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
    # Try to extract recommendation from text
    recommendation = "APPROVE_WITH_NOTES" # Default

    if text.upcase.include?("REJECT")
      recommendation = "REJECT"
    elsif text.upcase.include?("NEEDS_IMPROVEMENT")
      recommendation = "NEEDS_IMPROVEMENT"
    elsif text.upcase.include?("APPROVE_WITH_NOTES")
      recommendation = "APPROVE_WITH_NOTES"
    elsif text.upcase.include?("APPROVE")
      recommendation = "APPROVE"
    end

    {
      recommendation: recommendation,
      quality_score: calculate_default_score(recommendation),
      strengths: ["Prompt analysis attempted"],
      weaknesses: ["Could benefit from further review"],
      suggestions: ["Consider additional improvements"],
      reasoning: "Automated quality assessment based on text analysis",
    }
  end

  def calculate_default_score(recommendation)
    case recommendation
    when "APPROVE" then 95
    when "APPROVE_WITH_NOTES" then 80
    when "NEEDS_IMPROVEMENT" then 65
    when "REJECT" then 45
    else 75
    end
  end
end

# Mock Provider for ReviewerAgent
class MockReviewerProvider
  def initialize(config)
    @config = config
  end

  def chat(params)
    Rails.logger.info "MockReviewerProvider: Simulating quality review"

    # Extract context for mock analysis
    context = params[:context] || ""
    round = extract_round(context)

    # Simulate different recommendations based on round
    recommendation = determine_mock_recommendation(round)

    mock_response = {
      "recommendation" => recommendation,
      "quality_score" => calculate_mock_score(recommendation),
      "strengths" => generate_mock_strengths(recommendation),
      "weaknesses" => generate_mock_weaknesses(recommendation),
      "suggestions" => generate_mock_suggestions(recommendation),
      "reasoning" => generate_mock_reasoning(recommendation, round),
    }

    JSON.generate(mock_response)
  end

  private

  def extract_round(context)
    match = context.match(/\*\*ROUND (\d+) REVIEW\*\*/)
    match ? match[1].to_i : 1
  end

  def determine_mock_recommendation(round)
    case round
    when 1
      "APPROVE_WITH_NOTES"
    when 2
      ["APPROVE_WITH_NOTES", "APPROVE"].sample
    else
      "APPROVE"
    end
  end

  def calculate_mock_score(recommendation)
    case recommendation
    when "APPROVE" then 92
    when "APPROVE_WITH_NOTES" then 78
    when "NEEDS_IMPROVEMENT" then 62
    when "REJECT" then 45
    else 75
    end
  end

  def generate_mock_strengths(recommendation)
    strengths = [
      "Clear instruction structure",
      "Appropriate level of detail",
      "Good context provision",
    ]

    if recommendation == "APPROVE"
      strengths << "Excellent specificity and clarity"
      strengths << "Well-defined expected outcomes"
    end

    strengths
  end

  def generate_mock_weaknesses(recommendation)
    return [] if recommendation == "APPROVE"

    weaknesses = []

    if recommendation.include?("NOTES") || recommendation == "NEEDS_IMPROVEMENT"
      weaknesses << "Could benefit from more specific examples"
      weaknesses << "Some ambiguity in requirements"
    end

    if recommendation == "REJECT"
      weaknesses << "Lacks clear structure"
      weaknesses << "Missing essential context"
      weaknesses << "Ambiguous instructions"
    end

    weaknesses
  end

  def generate_mock_suggestions(recommendation)
    return [] if recommendation == "APPROVE"

    suggestions = []

    if recommendation.include?("NOTES")
      suggestions << "Add specific examples to illustrate key points"
      suggestions << "Consider breaking complex instructions into steps"
    end

    if recommendation == "NEEDS_IMPROVEMENT"
      suggestions << "Restructure for better clarity"
      suggestions << "Add more context about expected output"
      suggestions << "Define technical terms explicitly"
    end

    if recommendation == "REJECT"
      suggestions << "Complete restructure needed"
      suggestions << "Add comprehensive context"
      suggestions << "Define clear success criteria"
    end

    suggestions
  end

  def generate_mock_reasoning(recommendation, round)
    base = "Round #{round} analysis: "

    case recommendation
    when "APPROVE"
      base + "The prompt has reached excellent quality standards with clear instructions, appropriate context, and well-defined expectations."
    when "APPROVE_WITH_NOTES"
      base + "Good overall quality with effective improvements, though minor enhancements could further optimize clarity and specificity."
    when "NEEDS_IMPROVEMENT"
      base + "While showing progress, the prompt requires additional refinement to achieve optimal clarity and effectiveness."
    when "REJECT"
      base + "Significant issues remain that prevent effective use. Major restructuring recommended."
    else
      base + "Quality assessment completed with mixed results."
    end
  end
end
