class PromptEngineerAgent
  def initialize(provider_config)
    @provider_config = provider_config
    @ai_provider = create_ai_provider
  end

  def improve(context)
    Rails.logger.info "PromptEngineerAgent: Starting improvement for round #{context[:round]}"

    prompt = build_improvement_prompt(context)
    response = @ai_provider.chat(prompt)

    parse_improvement_response(response)
  end

  private

  def create_ai_provider
    # Reuse the same provider creation logic from PromptImprovementService
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
          temperature: 0.7,
          max_output_tokens: 1500,
        },
      },
    )
  end

  def create_mock_provider
    MockPromptEngineerProvider.new(@provider_config)
  end

  def build_improvement_prompt(context)
    system_prompt = <<~PROMPT
      You are an expert Prompt Engineer in a multi-agent team. Your role is to improve prompts through advanced engineering techniques.
      
      CONTEXT:
      - This is Round #{context[:round]} of iterative improvement
      - You are working with a Reviewer and Lead Agent
      - Focus on specific, measurable improvements
      
      TECHNIQUES TO APPLY:
      - Chain-of-Thought reasoning
      - Few-shot examples when appropriate
      - Role-based instructions
      - Structured output formats
      - Context enhancement
      - Specificity improvements
      
      Your response must be JSON:
      {
        "improved_prompt": "The enhanced prompt with clear improvements",
        "reasoning": "Explanation of what you improved and why",
        "techniques": ["List of techniques applied"],
        "changes_made": ["Specific changes from previous version"]
      }
    PROMPT

    user_content = build_user_content(context)

    format_prompt_for_provider(system_prompt, user_content)
  end

  def build_user_content(context)
    content = []

    content << "**ORIGINAL PROMPT:**"
    content << context[:original_prompt]
    content << ""

    if context[:current_prompt] != context[:original_prompt]
      content << "**CURRENT VERSION:**"
      content << context[:current_prompt]
      content << ""
    end

    if context[:context].present?
      content << "**TASK CONTEXT:**"
      content << context[:context]
      content << ""
    end

    if context[:target_audience].present?
      content << "**TARGET AUDIENCE:**"
      content << context[:target_audience]
      content << ""
    end

    if context[:feedback_history].present? && context[:round] > 1
      content << "**PREVIOUS FEEDBACK:**"
      recent_feedback = context[:feedback_history].last(2)
      recent_feedback.each do |feedback|
        if feedback["agent"] == "reviewer"
          content << "Reviewer noted: #{feedback["reasoning"]}"
          if feedback["suggestions"].present?
            content << "Suggestions: #{feedback["suggestions"].join(", ")}"
          end
        end
      end
      content << ""
    end

    content << "Please improve the current prompt with specific enhancements. Respond in JSON format."

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
        temperature: 0.7,
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
        type: "prompt_engineer",
        context: user_content,
      }
    end
  end

  def parse_improvement_response(response)
    response_text = extract_response_text(response)

    Rails.logger.info "PromptEngineer response: #{response_text[0..200]}..."

    begin
      parsed = JSON.parse(response_text)

      if parsed.is_a?(Hash) && parsed["improved_prompt"].present?
        return {
                 improved_prompt: parsed["improved_prompt"],
                 reasoning: parsed["reasoning"] || "Prompt improvements applied",
                 techniques: parsed["techniques"] || [],
                 changes_made: parsed["changes_made"] || [],
               }
      end
    rescue JSON::ParserError => e
      Rails.logger.warn "Failed to parse PromptEngineer JSON: #{e.message}"
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
    # Try to extract improved prompt from various formats
    improved_prompt = text

    if text.include?("improved_prompt")
      match = text.match(/"improved_prompt":\s*"([^"]+)"/m)
      improved_prompt = match[1] if match
    end

    {
      improved_prompt: improved_prompt,
      reasoning: "Prompt enhancement attempted",
      techniques: ["General Improvement"],
      changes_made: ["Enhanced based on AI analysis"],
    }
  end
end

# Mock Provider for PromptEngineerAgent
class MockPromptEngineerProvider
  def initialize(config)
    @config = config
  end

  def chat(params)
    Rails.logger.info "MockPromptEngineerProvider: Simulating improvement"

    # Extract context for mock response
    context = params[:context] || ""
    original_prompt = extract_original_prompt(context)

    mock_response = {
      "improved_prompt" => enhance_prompt_mock(original_prompt),
      "reasoning" => "Applied structured instructions and enhanced clarity for better AI comprehension",
      "techniques" => [
        "Chain-of-Thought prompting",
        "Structured output format",
        "Role-based instructions",
        "Context enhancement",
      ],
      "changes_made" => [
        "Added step-by-step instruction structure",
        "Enhanced specificity in requirements",
        "Included example format guidance",
        "Clarified expected output format",
      ],
    }

    JSON.generate(mock_response)
  end

  private

  def extract_original_prompt(context)
    match = context.match(/\*\*ORIGINAL PROMPT:\*\*\s*(.+?)(?:\n\n|\*\*|$)/m)
    match ? match[1].strip : "Sample prompt to improve"
  end

  def enhance_prompt_mock(original)
    enhanced = original.dup

    # Add structure if missing
    unless enhanced.include?("step")
      enhanced += "\n\nPlease provide your response in a step-by-step format."
    end

    # Add specificity
    unless enhanced.include?("specific") || enhanced.include?("detailed")
      enhanced += " Be specific and detailed in your explanation."
    end

    # Add example request
    unless enhanced.include?("example")
      enhanced += " Include relevant examples to illustrate your points."
    end

    enhanced
  end
end
