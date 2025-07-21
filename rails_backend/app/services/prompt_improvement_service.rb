class PromptImprovementService
  def initialize(original_prompt:, provider_config:, context: nil, target_audience: nil)
    @original_prompt = original_prompt
    @provider_config = provider_config
    @context = context
    @target_audience = target_audience
  end

  def call
    Rails.logger.info "Starting prompt improvement with provider: #{@provider_config[:provider]}"

    # Get AI provider
    provider = create_ai_provider

    # Build improvement prompt
    improvement_prompt = build_improvement_prompt

    # Get AI response
    response = provider.chat(improvement_prompt)

    # Parse and structure response
    parse_response(response)
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
          temperature: 0.7,
          max_output_tokens: 2000,
        },
      },
    )
  end

  def create_mock_provider
    MockAIProvider.new(@provider_config)
  end

  def build_improvement_prompt
    system_prompt = <<~PROMPT
      You are an expert prompt engineer specializing in improving AI prompts for maximum effectiveness. 
      You apply advanced prompt engineering techniques including Chain-of-Thought, Few-Shot examples, 
      role-based prompting, and meta-cognitive enhancement.
      
      Your task is to analyze and improve the given prompt while maintaining its core intent.
      
      Response format (JSON):
      {
        "analysis": {
          "main_goal": "Brief description of the prompt's main objective",
          "identified_problems": ["List of issues found in the original prompt"],
          "improvement_potential": "Assessment of how the prompt can be enhanced"
        },
        "improved_prompt": "The enhanced version of the original prompt",
        "improvements": {
          "applied_techniques": [
            {
              "name": "Technique name",
              "description": "How this technique was applied",
              "expected_effect": "Expected improvement from this technique"
            }
          ],
          "quality_score": 85
        }
      }
    PROMPT

    user_content = build_user_content

    case @provider_config[:provider]
    when "openai"
      {
        model: @provider_config[:model] || "gpt-4",
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_content },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }
    when "anthropic"
      {
        model: @provider_config[:model] || "claude-3-sonnet-20240229",
        messages: [
          { role: "user", content: "#{system_prompt}\n\n#{user_content}" },
        ],
        max_tokens: 2000,
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
      # Mock provider
      {
        prompt: "#{system_prompt}\n\n#{user_content}",
        type: "improvement",
      }
    end
  end

  def build_user_content
    content = "Please improve this prompt:\n\n#{@original_prompt}"

    if @context.present?
      content += "\n\nContext: #{@context}"
    end

    if @target_audience.present?
      content += "\n\nTarget Audience: #{@target_audience}"
    end

    content += "\n\nProvide your analysis and improved version in the specified JSON format."
    content
  end

  def parse_response(response)
    # Extract text content based on provider
    response_text = extract_response_text(response)

    Rails.logger.info "AI Response received: #{response_text[0..200]}..."

    # Try to parse as JSON
    begin
      parsed = JSON.parse(response_text)

      # Validate required fields
      if parsed.is_a?(Hash) && parsed["improved_prompt"].present?
        return {
                 improved_prompt: parsed["improved_prompt"],
                 analysis: parsed["analysis"] || {},
                 improvements: parsed["improvements"] || {},
                 architecture_used: "single_agent",
                 provider_used: @provider_config[:provider],
               }
      end
    rescue JSON::ParserError => e
      Rails.logger.warn "Failed to parse JSON response: #{e.message}"
    end

    # Fallback: try to extract improved prompt from text
    improved_prompt = extract_improved_prompt_from_text(response_text)

    {
      improved_prompt: improved_prompt,
      analysis: {
        main_goal: "Prompt improvement requested",
        identified_problems: ["Original prompt analysis"],
        improvement_potential: "Enhanced through AI assistance",
      },
      improvements: {
        applied_techniques: [
          {
            name: "AI-Assisted Improvement",
            description: "Prompt enhanced using AI capabilities",
            expected_effect: "Improved clarity and effectiveness",
          },
        ],
        quality_score: 75,
      },
      architecture_used: "single_agent",
      provider_used: @provider_config[:provider],
    }
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
      # Mock provider
      response.is_a?(String) ? response : response.to_s
    end
  end

  def extract_improved_prompt_from_text(text)
    # Try to find improved prompt in various formats
    patterns = [
      /"improved_prompt":\s*"([^"]+)"/m,
      /improved prompt:?\s*(.+?)(?:\n\n|\z)/mi,
      /enhanced version:?\s*(.+?)(?:\n\n|\z)/mi,
      /improved:?\s*(.+?)(?:\n\n|\z)/mi,
    ]

    patterns.each do |pattern|
      match = text.match(pattern)
      if match && match[1].present?
        return match[1].strip
      end
    end

    # If no pattern matches, return the original with a note
    "#{@original_prompt}\n\n[Enhanced version: #{text[0..100]}...]"
  end
end

# Mock AI Provider for testing
class MockAIProvider
  def initialize(config)
    @config = config
  end

  def chat(params)
    Rails.logger.info "MockAIProvider: Simulating #{@config[:provider]} response"

    # Simulate different response based on prompt type
    if params.is_a?(Hash) && params[:type] == "improvement"
      generate_mock_improvement_response(params[:prompt])
    else
      generate_mock_chat_response
    end
  end

  private

  def generate_mock_improvement_response(prompt)
    # Extract original prompt for mock improvement
    original = prompt.match(/Please improve this prompt:\s*(.+?)(?:\n|$)/m)&.captures&.first || "Sample prompt"

    mock_response = {
      "analysis" => {
        "main_goal" => "Improve the effectiveness and clarity of the given prompt",
        "identified_problems" => [
          "Lack of specific instructions",
          "Missing context or examples",
          "Could benefit from clearer structure",
        ],
        "improvement_potential" => "Significant enhancement possible through advanced prompt engineering techniques",
      },
      "improved_prompt" => "#{original}\n\n[IMPROVED] Please provide a detailed, step-by-step response with examples and clear reasoning.",
      "improvements" => {
        "applied_techniques" => [
          {
            "name" => "Structured Instructions",
            "description" => "Added clear step-by-step guidance",
            "expected_effect" => "More organized and comprehensive responses",
          },
          {
            "name" => "Example Requests",
            "description" => "Explicitly requested examples",
            "expected_effect" => "Concrete illustrations to improve understanding",
          },
        ],
        "quality_score" => 85,
      },
    }

    JSON.generate(mock_response)
  end

  def generate_mock_chat_response
    "This is a mock response from #{@config[:provider]} provider. In a real implementation, this would be the actual AI response."
  end
end
