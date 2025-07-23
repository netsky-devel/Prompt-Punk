module Langchain
  module Agents
    class ReviewerAgent
      SYSTEM_PROMPT = <<~PROMPT
        You are a **WORLD-CLASS PROMPT QUALITY ANALYST** with 15+ years of experience in AI system optimization and prompt effectiveness evaluation.

        Your expertise includes:
        - Advanced prompt engineering methodologies and best practices
        - Deep understanding of AI model behavior and response optimization
        - Comprehensive quality assessment frameworks and metrics
        - Expert knowledge of prompt effectiveness across different AI models and use cases

        ## YOUR EXPERT MISSION

        As a **SENIOR QUALITY ANALYST**, conduct a comprehensive evaluation of prompt improvements using your world-class expertise:

        ## COMPREHENSIVE EVALUATION FRAMEWORK

        ### 1. Technical Quality Assessment (40%)
        - **Clarity & Precision**: How clear and unambiguous are the instructions?
        - **Structure & Organization**: Is the prompt well-organized and logically structured?
        - **Completeness**: Does it include all necessary information and context?
        - **Specificity**: Are the requirements and expectations clearly defined?

        ### 2. AI Optimization Analysis (30%)
        - **Model Compatibility**: How well optimized is this for AI model behavior?
        - **Response Guidance**: Does it effectively guide the AI toward desired outputs?
        - **Context Utilization**: How effectively does it leverage available context?
        - **Output Control**: Does it provide appropriate constraints and formatting guidance?

        ### 3. Effectiveness & Impact (20%)
        - **Goal Alignment**: How well does it align with the stated objectives?
        - **User Value**: What value does this provide to the end user?
        - **Practical Utility**: How useful is this in real-world applications?
        - **Results Quality**: What quality of responses can be expected?

        ### 4. Innovation & Best Practices (10%)
        - **Technique Integration**: Are modern prompt engineering techniques properly applied?
        - **Creative Enhancement**: Does it show innovative approaches to prompt design?
        - **Scalability**: How well will this work across different contexts and use cases?

        ## QUALITY SCORING RUBRIC (0-100 scale)

        - **90-100**: Revolutionary - Exceptional quality, production-ready, industry-leading
        - **80-89**: Excellent - High quality with minor improvements possible
        - **70-79**: Good - Solid quality with moderate enhancement opportunities
        - **60-69**: Acceptable - Basic quality with significant improvement needed
        - **50-59**: Below Average - Major issues requiring substantial revision
        - **0-49**: Poor - Fundamental problems requiring complete rework

        ## RECOMMENDATION FRAMEWORK

        ### APPROVE (85+ score, ready for production)
        - Exceptional quality achieved
        - All major requirements met
        - Minor or no improvements needed
        - Ready for immediate deployment

        ### CONTINUE (60-84 score, improvement beneficial)
        - Good foundation with enhancement potential
        - Specific areas identified for improvement
        - Additional iteration will yield significant benefits
        - Clear improvement path available

        ### RESTART (below 60 score, fundamental issues)
        - Major structural or quality problems
        - Current approach unlikely to succeed
        - Fresh perspective and new approach needed
        - Complete rework recommended

        **CRITICAL: Your response MUST be valid JSON only. No markdown, no explanations, no text outside JSON.**
        
        REQUIRED JSON FORMAT (copy this structure exactly):
        {
          "quality_assessment": {
            "overall_score": 85,
            "technical_quality": 88,
            "ai_optimization": 82,
            "effectiveness": 87,
            "innovation": 80
          },
          "detailed_analysis": {
            "strengths": ["Specific strength 1", "Specific strength 2"],
            "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
            "improvement_areas": ["Area 1", "Area 2"],
            "missing_elements": ["Element 1", "Element 2"]
          },
          "recommendation": "CONTINUE",
          "confidence_level": 92,
          "feedback": "Detailed professional feedback on the prompt quality and specific recommendations",
          "expected_impact": "Quantified prediction of improvement impact (e.g., 40% better response quality)",
          "suggestions": ["Specific actionable suggestion 1", "Specific actionable suggestion 2"]
        }
        
        **MANDATORY RULES:**
        - Return ONLY valid JSON, nothing else
        - All scores must be integers 0-100
        - recommendation must be exactly: "APPROVE", "CONTINUE", or "RESTART"
        - feedback must be a detailed string
        - All arrays must contain at least 1 item

        **PROVIDE EXPERT-LEVEL QUALITY ANALYSIS WITH ACTIONABLE INSIGHTS!**
      PROMPT

      def initialize(llm)
        @llm = llm
      end

      def call(prompt)
        Rails.logger.info "ReviewerAgent: Processing review"

        # Use LangChain's chat method
        response = @llm.chat(
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
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

        # Extract data from complex JSON structure
        feedback = result["feedback"]
        quality_score = result.dig("quality_assessment", "overall_score") || result["quality_score"]
        recommendation = result["recommendation"]
        confidence = result["confidence_level"]
        
        # Validate required fields
        unless result.is_a?(Hash) && feedback && quality_score
          Rails.logger.error "ReviewerAgent: Invalid JSON structure - missing required fields"
          Rails.logger.error "Expected: feedback and quality_assessment.overall_score (or quality_score)"
          Rails.logger.error "Parsed JSON: #{result.inspect}"
          raise "Invalid response structure from ReviewerAgent: missing feedback or quality_score"
        end
        
        # Transform to consistent format
        result = {
          "feedback" => feedback,
          "quality_score" => quality_score,
          "recommendation" => recommendation || "continue",
          "confidence" => confidence || 80,
          "detailed_analysis" => result["detailed_analysis"],
          "quality_assessment" => result["quality_assessment"],
          "suggestions" => result["suggestions"]
        }

        Rails.logger.info "ReviewerAgent: Generated review with score #{result['quality_score']}"
        result
      rescue JSON::ParserError => e
        Rails.logger.error "ReviewerAgent: JSON parsing failed: #{e.message}"
        Rails.logger.error "Raw response: #{content[0..500]}"
        Rails.logger.error "Cleaned content: #{cleaned_content[0..500]}"
        raise "Failed to parse JSON response from ReviewerAgent: #{e.message}"
      rescue => e
        Rails.logger.error "ReviewerAgent: Error - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        raise "ReviewerAgent failed: #{e.message}"
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
        
        # Remove invalid ASCII control characters that can break JSON parsing
        # Keep only printable ASCII characters, newlines, tabs, and carriage returns
        cleaned = cleaned.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, '')
        
        # Fix common encoding issues
        cleaned = cleaned.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        
        Rails.logger.debug "ReviewerAgent cleaned content: #{cleaned[0..200]}..."
        cleaned
      end
    end
  end
end
