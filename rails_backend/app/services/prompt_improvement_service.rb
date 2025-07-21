class PromptImprovementService
  attr_reader :original_prompt, :provider_config, :architecture_config

  def initialize(original_prompt:, provider_config:, architecture_config: {})
    @original_prompt = original_prompt
    @provider_config = provider_config
    @architecture_config = architecture_config || {}
  end

  def call
    Rails.logger.info "PromptImprovementService: Processing with architecture: #{architecture_config[:architecture] || "auto"}"

    # Create AI provider
    ai_provider = create_ai_provider

    # Build the improvement prompt based on selected architecture
    prompt = build_improvement_prompt

    # Get AI response
    response = ai_provider.chat(
      system: prompt[:system],
      user: prompt[:user],
    )

    # Parse and return the response
    parse_response(response)
  rescue => e
    Rails.logger.error "PromptImprovementService error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    {
      improved_prompt: original_prompt,
      analysis: {
        main_goal: "Error occurred during processing",
        identified_problems: [e.message],
        improvement_potential: "Unable to process due to error",
      },
      improvements: {
        applied_techniques: [],
        expected_results: [],
        quality_score: 0,
      },
      architecture_used: architecture_config[:architecture] || "auto",
    }
  end

  private

  def create_ai_provider
    case provider_config[:provider]
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
    architecture = architecture_config[:architecture] || "auto"
    context = architecture_config[:context]
    target_audience = architecture_config[:target_audience]

    system_prompt = build_system_prompt_for_architecture(architecture)
    user_content = build_user_content(context, target_audience)

    {
      system: system_prompt,
      user: user_content,
    }
  end

  def build_system_prompt_for_architecture(architecture)
    base_prompt = <<~PROMPT
      You are a **LEADING PROMPT ENGINEERING EXPERT** with 15+ years of experience in AI and language models.

      Your expertise includes:
      - Deep knowledge of persuasion psychology and cognitive techniques
      - Masterful command of all modern prompt engineering frameworks
      - Ability to create prompts that improve response quality by 50-300%
      - Experience working with Fortune 500 companies on AI system optimization

      ## YOUR CRITICALLY IMPORTANT TASK

      Analyze the user's source prompt and create a **REVOLUTIONARILY IMPROVED VERSION** that:
      - Maximizes AI model potential
      - Eliminates all ambiguities and weaknesses
      - Applies cutting-edge prompt engineering techniques
      - Significantly exceeds the original version in quality

      ## SELECTED ARCHITECTURE: #{architecture.upcase.gsub("_", " ")}

      #{get_architecture_specific_techniques(architecture)}

      ## CRITICAL PRINCIPLES

      1. **QUALITY ABOVE ALL**: Every word should strengthen the prompt
      2. **PRESERVE INTENTIONS**: Don't change user's original goal  
      3. **MAXIMUM SPECIFICITY**: Avoid vague formulations
      4. **MEASURABLE EFFECT**: Aim for 3-5x improvement in response quality

      **CRITICAL LANGUAGE INSTRUCTION: Always respond in the SAME LANGUAGE as the user's original prompt.**

      **Return the result STRICTLY in the following JSON format:**

      ```json
      {
        "analysis": {
          "main_goal": "Clear description of the source prompt's main goal",
          "identified_problems": [
            "Specific critical problem 1",
            "Specific critical problem 2",
            "Specific critical problem 3"
          ],
          "improvement_potential": "Detailed description of improvement potential and expected effects",
          "missing_elements": [
            "Missing key element 1",
            "Missing key element 2"
          ]
        },
        "improved_prompt": "ONLY improved prompt text - powerful, detailed, structured",
        "improvements": {
          "applied_techniques": [
            {
              "name": "Specific technique",
              "description": "Detailed explanation of application", 
              "expected_effect": "Specific expected effect with metrics"
            }
          ],
          "expected_results": [
            "Specific measurable result 1",
            "Specific measurable result 2"
          ],
          "quality_score": 95
        },
        "architecture_used": "#{architecture}"
      }
      ```

      **CREATE A REVOLUTIONARY PROMPT THAT MAXIMIZES AI POTENTIAL!**
    PROMPT

    base_prompt
  end

  def get_architecture_specific_techniques(architecture)
    case architecture
    when "chain_of_thought"
      <<~TECHNIQUES
        ## MANDATORY TECHNIQUES TO APPLY (CHAIN OF THOUGHT FOCUS)

        ### 1. Advanced Chain-of-Thought (50-100% improvement)
        - Break complex instructions into logical reasoning steps
        - Use explicit transitions: "First analyze...", "Then consider...", "Finally conclude..."
        - Add reasoning validation: "Verify your logic by..."
        - Include metacognitive prompts: "Explain why this approach is optimal"

        ### 2. Step-by-Step Reasoning Enhancement
        - Add "Let's think step by step" triggers
        - Include intermediate verification points
        - Build logical dependency chains
        - Add error checking at each step

        ### 3. Cognitive Load Optimization
        - Structure complex tasks into manageable chunks
        - Add working memory aids
        - Include progress tracking mechanisms
      TECHNIQUES
    when "meta_cognitive"
      <<~TECHNIQUES
        ## MANDATORY TECHNIQUES TO APPLY (META-COGNITIVE FOCUS)

        ### 1. Meta-Cognitive Enhancement (cutting-edge 2024-2025)
        - "First explain your approach to solving this problem"
        - "What assumptions are you making and why?"
        - "How would you verify the quality of your response?"
        - Self-monitoring prompts: "Is this the best approach?"

        ### 2. Reflection and Self-Assessment
        - Add quality checkpoints: "Rate your confidence (1-10)"
        - Include alternative consideration: "What other approaches exist?"
        - Build in error detection: "What could go wrong?"
        - Add improvement cycles: "How could this be enhanced?"

        ### 3. Strategic Thinking Patterns
        - Include planning phases: "Before starting, outline your strategy"
        - Add perspective taking: "Consider this from multiple angles"
        - Build in learning loops: "What insights emerge?"
      TECHNIQUES
    when "5_tier_framework"
      <<~TECHNIQUES
        ## MANDATORY TECHNIQUES TO APPLY (5-TIER FRAMEWORK)

        ### 1. Role Assignment (Tier 1)
        - Assign specific expert roles with authority markers
        - Include credentials and experience indicators
        - Add specialization context: "As a leading expert in..."

        ### 2. Task Structuring (Tier 2)  
        - Break down into clear, sequential steps
        - Add success criteria for each phase
        - Include quality checkpoints and milestones

        ### 3. Rich Context (Tier 3)
        - Provide comprehensive background information
        - Add relevant constraints and requirements
        - Include success metrics and evaluation criteria

        ### 4. Example Integration (Tier 4)
        - Add high-quality examples (Few-shot learning)
        - Include both positive and negative examples
        - Show format and style expectations

        ### 5. Reinforcement Reminders (Tier 5)
        - Repeat critical requirements at key points
        - Add emphasis markers for crucial elements
        - Include final quality verification steps
      TECHNIQUES
    when "auto"
      <<~TECHNIQUES
        ## MANDATORY TECHNIQUES TO APPLY (AUTO-OPTIMIZED SELECTION)

        ### 1. EmotionPrompting (proven 8-115% improvement)
        - Add emotional stimuli: "This is extremely important for project success"
        - Create sense of responsibility: "The quality of this response depends on..."
        - Emphasize significance: "Show your best capabilities"

        ### 2. Advanced Chain-of-Thought (50-100% improvement)
        - Break complex instructions into logical steps
        - Use transitions: "First...", "Then...", "Finally..."
        - Ask AI to explain reasoning logic

        ### 3. CUTTING-EDGE 2024-2025 TECHNIQUES
        - **Curiosity Gap**: Create curiosity - "No one has found an elegant solution yet..."
        - **Future Pacing**: Project consequences - "Imagine the result in 5 years..."
        - **Zeigarnik Effect**: Create incompleteness - "We'll return to this question..."
        - **Multi-Token Prediction**: "Predict the next several steps simultaneously"
        - **Meta-cognitive Elements**: "First explain your approach to solving"
        - **Negative Prompting**: "DO NOT use generic phrases, DO NOT be superficial"

        ### 4. Psychological influence techniques
        - **Authority**: "As a leading expert in the field..."
        - **Social proof**: "Best practices show..."
        - **Commitment**: "You commit to provide..."
        - **Scarcity**: "This is a unique opportunity..."

        ### 5. 5-tier framework
        - **Role**: Assign specific expert role
        - **Task**: Structure task in detail step-by-step  
        - **Context**: Provide rich context and constraints
        - **Examples**: Include quality examples (Few-shot)
        - **Reminders**: Repeat key requirements
      TECHNIQUES
    else
      get_architecture_specific_techniques("auto")
    end
  end

  def build_user_content(context, target_audience)
    content = "Please improve this prompt:\n\n#{@original_prompt}"

    if context.present?
      content += "\n\nContext: #{context}"
    end

    if target_audience.present?
      content += "\n\nTarget Audience: #{target_audience}"
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
                 architecture_used: parsed["architecture_used"] || "auto",
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
