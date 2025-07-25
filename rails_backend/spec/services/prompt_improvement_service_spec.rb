require "rails_helper"

RSpec.describe PromptImprovementService do
  let(:original_prompt) { "Write a blog post about AI" }
  let(:provider_config) { { provider: "mock", model: "mock-model", api_key: "test" } }
  let(:base_architecture_config) { { context: "Tech writing", target_audience: "Developers" } }

  describe "#initialize" do
    it "sets instance variables correctly" do
      architecture_config = { architecture: "auto" }
      service = described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
        architecture_config: architecture_config,
      )

      expect(service.original_prompt).to eq(original_prompt)
      expect(service.provider_config).to eq(provider_config)
      expect(service.architecture_config).to eq(architecture_config)
    end

    it "handles nil architecture_config" do
      service = described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
      )

      expect(service.architecture_config).to eq({})
    end
  end

  describe "#call" do
    let(:service) do
      described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
        architecture_config: base_architecture_config.merge(architecture: "auto"),
      )
    end

    context "with mock provider" do
      it "returns structured response with mock data" do
        result = service.call

        expect(result).to include(:analysis, :improved_prompt, :improvements, :architecture_used)
        expect(result[:analysis]).to include("main_goal", "identified_problems", "improvement_potential")
        expect(result[:improvements]).to include("applied_techniques", "expected_results", "quality_score")
        expect(result[:improved_prompt]).to include("Write a blog post about AI") # Contains original prompt
        expect(result[:architecture_used]).to eq("auto")
      end
    end

    context "with error handling" do
      it "handles provider errors gracefully" do
        allow(service).to receive(:create_ai_provider).and_raise(StandardError.new("Connection failed"))

        result = service.call

        expect(result[:improved_prompt]).to eq(original_prompt)
        expect(result[:analysis][:identified_problems]).to include("Connection failed")
        expect(result[:improvements][:quality_score]).to eq(0)
      end
    end
  end

  describe "architecture-specific system prompts" do
    %w[auto chain_of_thought meta_cognitive 5_tier_framework].each do |architecture|
      context "with #{architecture} architecture" do
        let(:service) do
          described_class.new(
            original_prompt: original_prompt,
            provider_config: provider_config,
            architecture_config: base_architecture_config.merge(architecture: architecture),
          )
        end

        it "generates architecture-specific system prompt" do
          system_prompt = service.send(:build_system_prompt_for_architecture, architecture)

          # Common elements all prompts should have
          expect(system_prompt).to include("LEADING PROMPT ENGINEERING EXPERT")
          expect(system_prompt).to include("15+ years of experience")
          expect(system_prompt).to include("REVOLUTIONARILY IMPROVED VERSION")
          expect(system_prompt).to include("3-5x improvement")
          expect(system_prompt).to include("CREATE A REVOLUTIONARY PROMPT")

          # Architecture-specific content
          case architecture
          when "auto"
            expect(system_prompt).to include("AUTO-OPTIMIZED SELECTION")
            expect(system_prompt).to include("EmotionPrompting")
            expect(system_prompt).to include("Chain-of-Thought")
            expect(system_prompt).to include("CUTTING-EDGE 2024-2025 TECHNIQUES")
            expect(system_prompt).to include("Curiosity Gap")
            expect(system_prompt).to include("Future Pacing")
            expect(system_prompt).to include("Psychological influence")
          when "chain_of_thought"
            expect(system_prompt).to include("CHAIN OF THOUGHT FOCUS")
            expect(system_prompt).to include("logical reasoning steps")
            expect(system_prompt).to include("First analyze")
            expect(system_prompt).to include("Cognitive Load Optimization")
          when "meta_cognitive"
            expect(system_prompt).to include("META-COGNITIVE FOCUS")
            expect(system_prompt).to include("explain your approach")
            expect(system_prompt).to include("What assumptions")
            expect(system_prompt).to include("Self-Assessment")
          when "5_tier_framework"
            expect(system_prompt).to include("5-TIER FRAMEWORK")
            expect(system_prompt).to include("Role Assignment")
            expect(system_prompt).to include("Task Structuring")
            expect(system_prompt).to include("Rich Context")
            expect(system_prompt).to include("Example Integration")
            expect(system_prompt).to include("Reinforcement Reminders")
          end
        end
      end
    end
  end

  describe "#build_user_content" do
    let(:service) do
      described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
        architecture_config: base_architecture_config,
      )
    end

    it "includes original prompt" do
      content = service.send(:build_user_content, "context", "audience")
      expect(content).to include("Please improve this prompt:")
      expect(content).to include(original_prompt)
    end

    it "includes context when provided" do
      content = service.send(:build_user_content, "Test context", nil)
      expect(content).to include("Context: Test context")
    end

    it "includes target audience when provided" do
      content = service.send(:build_user_content, nil, "Test audience")
      expect(content).to include("Target Audience: Test audience")
    end

    it "includes both context and audience" do
      content = service.send(:build_user_content, "Test context", "Test audience")
      expect(content).to include("Context: Test context")
      expect(content).to include("Target Audience: Test audience")
    end

    it "handles nil values gracefully" do
      content = service.send(:build_user_content, nil, nil)
      expect(content).to include("Please improve this prompt:")
      expect(content).not_to include("Context:")
      expect(content).not_to include("Target Audience:")
    end
  end

  describe "AI provider creation" do
    let(:service) do
      described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
        architecture_config: base_architecture_config,
      )
    end

    it "creates mock provider for unknown provider" do
      config = { provider: "unknown", api_key: "test" }
      provider = service.send(:create_ai_provider, config)
      expect(provider).to be_a(MockAIProvider)
    end

    context "with different provider types" do
      %w[openai anthropic google unknown].each do |provider_type|
        it "handles #{provider_type} provider" do
          config = provider_config.merge(provider: provider_type)
          expect { service.send(:create_ai_provider, config) }.not_to raise_error
        end
      end
    end
  end

  describe "response parsing" do
    let(:service) do
      described_class.new(
        original_prompt: original_prompt,
        provider_config: provider_config,
        architecture_config: base_architecture_config.merge(architecture: "auto"),
      )
    end

    context "with valid JSON response" do
      it "parses valid JSON correctly" do
        json_response = {
          "analysis" => { "main_goal" => "Create engaging content" },
          "improved_prompt" => "Enhanced prompt",
          "improvements" => { "quality_score" => 90 },
        }.to_json

        result = service.send(:parse_response, json_response)

        expect(result[:analysis]["main_goal"]).to eq("Create engaging content")
        expect(result[:improved_prompt]).to eq("Enhanced prompt")
        expect(result[:improvements]["quality_score"]).to eq(90)
      end
    end

    context "with invalid JSON response" do
      it "handles malformed JSON" do
        malformed_response = "invalid json {..."
        result = service.send(:parse_response, malformed_response)

        expect(result[:improved_prompt]).to include(original_prompt)
        expect(result[:improved_prompt]).to include("Enhanced version")
      end

      it "handles empty response" do
        result = service.send(:parse_response, "")

        expect(result[:improved_prompt]).to include(original_prompt)
        expect(result[:improved_prompt]).to include("Enhanced version")
      end
    end
  end

  describe "MockAIProvider" do
    let(:mock_provider) { MockAIProvider.new({}) }

    it "returns valid JSON response" do
      response = mock_provider.chat(
        system: "You are an AI assistant",
        user: "Test prompt",
      )

      expect { JSON.parse(response) }.not_to raise_error
    end

    it "includes mock improvement text" do
      user_prompt = "Write a blog post"
      response = mock_provider.chat(
        system: "You are an AI assistant",
        user: user_prompt,
      )

      parsed = JSON.parse(response)
      expect(parsed["improved_prompt"]).to include(user_prompt)
      expect(parsed["analysis"]).to be_present
      expect(parsed["improvements"]).to be_present
    end
  end
end
