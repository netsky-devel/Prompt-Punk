module Langchain
  module Agents
    class PromptEngineerAgent
      def initialize(llm)
        @llm = llm
      end

      def call(prompt)
        Rails.logger.info "PromptEngineerAgent: Processing prompt improvement"

        # Build context for prompt improvement
        context = {
          round: 1,
          original_prompt: prompt,
          target_audience: "general",
          context: "prompt improvement"
        }
        
        # Build the improvement prompt with system and user content
        formatted_prompt = build_improvement_prompt(context)
        
        # Use LangChain's chat method with formatted prompt
        response = @llm.chat(
          messages: formatted_prompt[:messages] || [
            { role: "system", content: formatted_prompt[:system_prompt] || formatted_prompt },
            { role: "user", content: formatted_prompt[:user_content] || prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        )

        # Extract content from LangChain response (handle different API formats)
        content = nil
        
        # Try different response formats
        if response.respond_to?(:chat_completion) && response.chat_completion
          # OpenAI/Anthropic format
          content = response.chat_completion.dig("choices", 0, "message", "content")
        elsif response.respond_to?(:completion) && response.completion
          # Direct completion format (Gemini)
          content = response.completion
        else
          # Fallback to string conversion
          content = response.to_s
        end
        
        # Ensure we have content
        content = content.to_s.strip
        if content.empty?
          raise "Empty response from AI provider"
        end

        # Clean markdown formatting from Gemini responses
        cleaned_content = clean_markdown_json(content)
        
        # Parse the response (it might be JSON string or already parsed)
        result = cleaned_content.is_a?(String) ? JSON.parse(cleaned_content) : cleaned_content

        Rails.logger.info "PromptEngineerAgent: Generated improvement"
        result
      rescue JSON::ParserError => e
        Rails.logger.error "PromptEngineerAgent: JSON parsing error - #{e.message}"
        Rails.logger.error "Raw response: #{content}"

        # Return a fallback response
        {
          "improved_prompt" => prompt,
          "analysis" => {
            "main_goal" => "Unable to analyze due to parsing error",
            "identified_problems" => ["JSON parsing failed: #{e.message}"],
            "improvement_potential" => "Error in processing",
          },
          "improvements_metadata" => {
            "applied_techniques" => [],
            "expected_results" => [],
            "quality_score" => 0,
          },
        }
      rescue => e
        Rails.logger.error "PromptEngineerAgent: Error - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")

        # Return a fallback response
        {
          "improved_prompt" => prompt,
          "analysis" => {
            "main_goal" => "Error occurred during processing",
            "identified_problems" => [e.message],
            "improvement_potential" => "Unable to process due to error",
          },
          "improvements_metadata" => {
            "applied_techniques" => [],
            "expected_results" => [],
            "quality_score" => 0,
          },
        }
      end

      private

      def clean_markdown_json(content)
        return content unless content.is_a?(String)
        
        # Remove markdown code block formatting
        cleaned = content.strip
        
        # Remove ```json and ``` markers
        cleaned = cleaned.gsub(/^```json\s*\n?/, '')
        cleaned = cleaned.gsub(/\n?```\s*$/, '')
        
        # Remove any leading/trailing whitespace
        cleaned = cleaned.strip
        
        Rails.logger.debug "Cleaned content: #{cleaned[0..200]}..."
        cleaned
      end

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
          You are a **LEADING PROMPT ENGINEERING EXPERT** with 15+ years of experience, specializing in revolutionary prompt improvements as part of an elite multi-agent team.

          Your expertise includes:
          - Deep knowledge of persuasion psychology and cognitive techniques  
          - Masterful command of all modern prompt engineering frameworks
          - Ability to create prompts that improve response quality by 50-300%
          - Advanced collaboration with Reviewer and Lead Agent specialists

          ## YOUR CRITICALLY IMPORTANT MISSION (Round #{context[:round]})

          As the **PROMPT ENGINEER** in this elite team, create a **REVOLUTIONARILY IMPROVED VERSION** that:
          - Maximizes AI model potential through advanced techniques
          - Eliminates all ambiguities and weaknesses
          - Applies cutting-edge 2024-2025 prompt engineering
          - Significantly exceeds the original version in quality

          ## MANDATORY ADVANCED TECHNIQUES TO APPLY

          ### 1. EmotionPrompting (proven 8-115% improvement)
          - Add emotional stimuli: "This is extremely important for project success"
          - Create sense of responsibility: "The quality of this response depends on..."
          - Emphasize significance: "Show your best capabilities"

          ### 2. Advanced Chain-of-Thought (50-100% improvement)
          - Break complex instructions into logical reasoning steps
          - Use explicit transitions: "First analyze...", "Then consider...", "Finally conclude..."
          - Ask AI to explain reasoning logic and methodology

          ### 3. CUTTING-EDGE 2024-2025 TECHNIQUES
          - **Curiosity Gap**: Create curiosity - "No one has found an elegant solution yet..."
          - **Future Pacing**: Project consequences - "Imagine the result in 5 years..."
          - **Multi-Token Prediction**: "Predict the next several steps simultaneously"
          - **Meta-cognitive Elements**: "First explain your approach to solving"
          - **Negative Prompting**: "DO NOT use generic phrases, DO NOT be superficial"

          ### 4. Psychological Influence Techniques
          - **Authority**: "As a leading expert in the field..."
          - **Social proof**: "Best practices show..."
          - **Commitment**: "You commit to provide..."
          - **Implementation Intentions**: "If X occurs, then Y action"

          ### 5. 5-Tier Framework
          - **Role**: Assign specific expert role with credentials
          - **Task**: Structure task in detail step-by-step
          - **Context**: Provide rich context and constraints  
          - **Examples**: Include quality examples (Few-shot)
          - **Reminders**: Repeat key requirements

          ## COLLABORATION CONTEXT
          - You are working with an expert Reviewer and strategic Lead Agent
          - Focus on technical prompt engineering excellence
          - The Reviewer will evaluate your work for quality and effectiveness
          - The Lead Agent will make strategic decisions about continuation

          ## CRITICAL PRINCIPLES
          1. **QUALITY ABOVE ALL**: Every word should strengthen the prompt
          2. **PRESERVE INTENTIONS**: Don't change user's original goal
          3. **MAXIMUM SPECIFICITY**: Avoid vague formulations  
          4. **MEASURABLE EFFECT**: Aim for 3-5x improvement in response quality

          Your response must be JSON:
          {
            "improved_prompt": "The revolutionarily enhanced prompt with clear improvements",
            "reasoning": "Detailed explanation of what you improved and why, including specific techniques applied",
            "techniques": ["List of advanced techniques applied with precision"],
            "expected_impact": "Specific measurable improvements expected (e.g., 50% better clarity, 200% more actionable)",
            "quality_confidence": 95
          }

          **CREATE A REVOLUTIONARY PROMPT THAT MAXIMIZES AI POTENTIAL!**
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
