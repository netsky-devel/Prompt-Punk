require "rails_helper"

RSpec.describe SingleAgentJob, type: :job do
  let(:task) { create(:prompt_task, :single_agent) }
  let(:provider_config) { { provider: "mock", model: "mock-model", api_key: "test_key" } }
  let(:architecture_config) { { architecture: "auto", context: "Test context", target_audience: "Developers" } }

  describe "#perform" do
    context "with successful processing" do
      it "updates task status to processing" do
        expect {
          described_class.new.perform(task.id, provider_config, architecture_config)
        }.to change { task.reload.status }.from("pending").to("completed")
      end

      it "sets started_at timestamp" do
        described_class.new.perform(task.id, provider_config, architecture_config)

        expect(task.reload.started_at).to be_present
        expect(task.started_at).to be_within(5.seconds).of(Time.current)
      end

      it "sets completed_at timestamp" do
        described_class.new.perform(task.id, provider_config, architecture_config)

        expect(task.reload.completed_at).to be_present
        expect(task.completed_at).to be_within(5.seconds).of(Time.current)
      end

      it "creates a prompt improvement record" do
        expect {
          described_class.new.perform(task.id, provider_config, architecture_config)
        }.to change(PromptImprovement, :count).by(1)
      end

      it "saves improvement with correct architecture" do
        described_class.new.perform(task.id, provider_config, architecture_config)

        improvement = task.reload.prompt_improvement
        expect(improvement.architecture_used).to eq("auto")
      end

      it "logs processing information" do
        expect(Rails.logger).to receive(:info).with(/Starting task \d+ with architecture: auto/)
        expect(Rails.logger).to receive(:info).with(/Completed task \d+/)

        described_class.new.perform(task.id, provider_config, architecture_config)
      end
    end

    context "with architecture variations" do
      %w[auto chain_of_thought meta_cognitive 5_tier_framework].each do |architecture|
        it "handles #{architecture} architecture" do
          config = architecture_config.merge(architecture: architecture)

          expect {
            described_class.new.perform(task.id, provider_config, config)
          }.not_to raise_error

          improvement = task.reload.prompt_improvement
          expect(improvement.architecture_used).to eq(architecture)
        end
      end
    end

    context "with missing architecture_config" do
      it "handles missing architecture_config gracefully" do
        expect {
          described_class.new.perform(task.id, provider_config)
        }.not_to raise_error
      end

      it "defaults to empty config when architecture_config is nil" do
        described_class.new.perform(task.id, provider_config, nil)

        improvement = task.reload.prompt_improvement
        expect(improvement.architecture_used).to eq("auto") # Default fallback
      end
    end

    context "with error scenarios" do
      it "handles service errors gracefully" do
        allow(PromptImprovementService).to receive(:new).and_raise(StandardError.new("Service error"))

        expect {
          described_class.new.perform(task.id, provider_config, architecture_config)
        }.to raise_error(StandardError)

        expect(task.reload.status).to eq("failed")
        expect(task.error_message).to eq("Service error")
      end

      it "handles task not found" do
        expect {
          described_class.new.perform(99999, provider_config, architecture_config)
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "logs error information" do
        allow(PromptImprovementService).to receive(:new).and_raise(StandardError.new("Test error"))

        expect(Rails.logger).to receive(:error).with(/SingleAgentJob failed for task \d+: Test error/)
        expect(Rails.logger).to receive(:error).with(/.*/)  # backtrace

        expect {
          described_class.new.perform(task.id, provider_config, architecture_config)
        }.to raise_error(StandardError)
      end
    end

    context "with processing time validation" do
      it "ensures minimum processing time for validation" do
        # Mock very fast processing
        allow_any_instance_of(PromptTask).to receive(:processing_time).and_return(0)

        described_class.new.perform(task.id, provider_config, architecture_config)

        improvement = task.reload.prompt_improvement
        expect(improvement.processing_time_seconds).to be >= 0.1
      end

      it "calculates actual processing time when available" do
        described_class.new.perform(task.id, provider_config, architecture_config)

        improvement = task.reload.prompt_improvement
        expect(improvement.processing_time_seconds).to be > 0
      end
    end
  end

  describe "private methods" do
    let(:job) { described_class.new }

    describe "#improve_prompt" do
      it "calls PromptImprovementService with correct parameters" do
        expect(PromptImprovementService).to receive(:new).with(
          original_prompt: task.original_prompt,
          provider_config: provider_config,
          architecture_config: architecture_config,
        ).and_call_original

        job.send(:improve_prompt, task.original_prompt, provider_config, architecture_config)
      end

      it "returns service result" do
        result = job.send(:improve_prompt, task.original_prompt, provider_config, architecture_config)

        expect(result).to include(
          :improved_prompt,
          :analysis,
          :improvements,
          :architecture_used
        )
      end
    end

    describe "#save_improvement" do
      let(:mock_result) do
        {
          improved_prompt: "Enhanced prompt",
          analysis: {
            main_goal: "Test goal",
            identified_problems: ["Problem 1", "Problem 2"],
            improvement_potential: "High potential",
          },
          improvements: {
            applied_techniques: [
              { name: "Technique 1", description: "Desc 1", expected_effect: "Effect 1" },
            ],
            expected_results: ["Result 1", "Result 2"],
            quality_score: 85,
          },
          architecture_used: "auto",
          provider_used: "mock",
        }
      end

      before do
        job.instance_variable_set(:@task, task)
      end

      it "creates PromptImprovement with correct attributes" do
        job.send(:save_improvement, mock_result)

        improvement = task.reload.prompt_improvement
        expect(improvement.improved_prompt).to eq("Enhanced prompt")
        expect(improvement.quality_score).to eq(85)
        expect(improvement.architecture_used).to eq("auto")
        expect(improvement.provider_used).to eq("mock")
      end

      it "saves analysis data as JSON" do
        job.send(:save_improvement, mock_result)

        improvement = task.reload.prompt_improvement
        analysis = JSON.parse(improvement.analysis_data)
        expect(analysis["main_goal"]).to eq("Test goal")
        expect(analysis["identified_problems"]).to eq(["Problem 1", "Problem 2"])
      end

      it "saves improvements metadata as JSON" do
        job.send(:save_improvement, mock_result)

        improvement = task.reload.prompt_improvement
        metadata = JSON.parse(improvement.improvements_metadata)
        expect(metadata["applied_techniques"]).to be_an(Array)
        expect(metadata["expected_results"]).to eq(["Result 1", "Result 2"])
      end
    end

    describe "#extract_improved_prompt" do
      it "extracts prompt from nested hash" do
        result = { improved_prompt: "Test prompt" }
        prompt = job.send(:extract_improved_prompt, result)
        expect(prompt).to eq("Test prompt")
      end

      it "handles missing improved_prompt key" do
        result = { other_key: "value" }
        prompt = job.send(:extract_improved_prompt, result)
        expect(prompt).to eq("Unable to extract improved prompt")
      end

      it "handles nil result" do
        prompt = job.send(:extract_improved_prompt, nil)
        expect(prompt).to eq("Unable to extract improved prompt")
      end
    end

    describe "#extract_quality_score" do
      it "extracts quality score from nested improvements" do
        result = { improvements: { quality_score: 90 } }
        score = job.send(:extract_quality_score, result)
        expect(score).to eq(90)
      end

      it "returns default score when missing" do
        result = { improvements: {} }
        score = job.send(:extract_quality_score, result)
        expect(score).to eq(75)
      end

      it "handles completely missing improvements" do
        result = {}
        score = job.send(:extract_quality_score, result)
        expect(score).to eq(75)
      end
    end
  end

  describe "job configuration" do
    it "is queued on default queue" do
      expect(described_class.queue_name).to eq("default")
    end

    it "can be performed later" do
      expect {
        described_class.perform_later(task.id, provider_config, architecture_config)
      }.to have_enqueued_job(described_class)
    end
  end
end
