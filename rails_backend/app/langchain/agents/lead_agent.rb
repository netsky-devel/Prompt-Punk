module Langchain
  module Agents
    class LeadAgent
      SYSTEM_PROMPT = <<~PROMPT
        You are the **EXECUTIVE LEAD AGENT** - a world-class strategic decision maker with 20+ years of experience in AI system optimization and team leadership.

        Your expertise includes:
        - Strategic analysis of prompt quality and improvement potential
        - Advanced understanding of AI capability maximization
        - Expert coordination of multi-agent collaborative workflows
        - Proven track record of delivering 300-500% AI performance improvements

        ## YOUR STRATEGIC MISSION

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

      def initialize(llm)
        @llm = llm
      end

      def call(prompt)
        Rails.logger.info "LeadAgent: Processing strategic decision"

        # Use LangChain's chat method
        response = @llm.chat(
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1000,
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

        # Validate required fields
        unless result.is_a?(Hash) && result["decision"] && result["reasoning"]
          Rails.logger.error "LeadAgent: Invalid JSON structure - missing required fields"
          Rails.logger.error "Parsed JSON: #{result.inspect}"
          raise "Invalid response structure from LeadAgent: missing decision or reasoning"
        end

        Rails.logger.info "LeadAgent: Generated strategic decision: #{result['decision']}"
        result
      rescue JSON::ParserError => e
        Rails.logger.error "LeadAgent: JSON parsing failed: #{e.message}"
        Rails.logger.error "Raw response: #{content[0..500]}"
        Rails.logger.error "Cleaned content: #{cleaned_content[0..500]}"
        raise "Failed to parse JSON response from LeadAgent: #{e.message}"
      rescue => e
        Rails.logger.error "LeadAgent: Error - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        raise "LeadAgent failed: #{e.message}"
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
        
        Rails.logger.debug "LeadAgent cleaned content: #{cleaned[0..200]}..."
        cleaned
      end
    end
  end
end
