require "rails_helper"

RSpec.describe PromptTask, type: :model do
  describe "associations" do
    it { should have_one(:prompt_improvement).dependent(:destroy) }
    it { should have_one(:multi_agent_session).dependent(:destroy) }
  end

  describe "validations" do
    let(:task) { build(:prompt_task) }

    it { should validate_presence_of(:original_prompt) }
    it { should validate_length_of(:original_prompt).is_at_least(10).is_at_most(10000) }

    # Skip presence validation tests for fields with set_defaults callback
    it "validates status inclusion" do
      expect { task.status = "invalid_status" }.to raise_error(ArgumentError)
    end

    it "validates improvement_type inclusion" do
      expect { task.improvement_type = "invalid_type" }.to raise_error(ArgumentError)
    end

    # Test presence for fields without defaults
    it "validates provider presence after bypassing defaults" do
      task.provider = nil
      task.save(validate: false) # Skip before_validation callbacks
      task.provider = ""
      expect(task).not_to be_valid
      expect(task.errors[:provider]).to include("can't be blank")
    end

    it "validates ai_model presence after bypassing defaults" do
      task.ai_model = nil
      task.save(validate: false)
      task.ai_model = ""
      expect(task).not_to be_valid
      expect(task.errors[:ai_model]).to include("can't be blank")
    end

    it { should validate_length_of(:provider).is_at_most(50) }
    it { should validate_length_of(:ai_model).is_at_most(100) }

    it { should validate_numericality_of(:max_rounds).is_greater_than(0).is_less_than_or_equal_to(20).allow_nil }

    it { should validate_length_of(:context).is_at_most(1000).allow_blank }
    it { should validate_length_of(:target_audience).is_at_most(500).allow_blank }

    it "validates architecture inclusion" do
      valid_architectures = %w[auto chain_of_thought meta_cognitive 5_tier_framework]
      valid_architectures.each do |arch|
        task.architecture = arch
        expect(task).to be_valid
      end

      task.architecture = "invalid_architecture"
      expect(task).not_to be_valid
      expect(task.errors[:architecture]).to include("is not included in the list")
    end
  end

  describe "enums" do
    it { should define_enum_for(:status).with_values(pending: 0, processing: 1, completed: 2, failed: 3) }
    it { should define_enum_for(:improvement_type).with_values(single_agent: 0, multi_agent: 1) }
  end

  describe "scopes" do
    # Create tasks with explicit attributes using enum symbols
    let!(:task1) { create(:prompt_task, :completed, created_at: 1.day.ago) }
    let!(:task2) { create(:prompt_task, :processing, created_at: 2.hours.ago) }
    let!(:task3) { create(:prompt_task, created_at: 1.hour.ago) } # defaults to pending

    describe ".recent" do
      it "orders tasks by created_at desc" do
        tasks = PromptTask.recent.to_a
        expect(tasks.map(&:id)).to eq([task3.id, task2.id, task1.id])
      end
    end

    describe ".by_status" do
      it "filters tasks by status" do
        expect(PromptTask.by_status(:completed).pluck(:id)).to contain_exactly(task1.id)
        expect(PromptTask.by_status(:processing).pluck(:id)).to contain_exactly(task2.id)
        expect(PromptTask.by_status(:pending).pluck(:id)).to contain_exactly(task3.id)
      end
    end

    describe ".by_provider" do
      let!(:openai_task) { create(:prompt_task, provider: "openai") }

      it "filters tasks by provider" do
        expect(PromptTask.by_provider("openai").pluck(:id)).to contain_exactly(openai_task.id)
        google_tasks = PromptTask.by_provider("google").pluck(:id)
        expect(google_tasks).to include(task1.id, task2.id, task3.id)
      end
    end

    describe ".by_architecture" do
      let!(:cot_task) { create(:prompt_task, :chain_of_thought) }
      let!(:meta_task) { create(:prompt_task, :meta_cognitive) }

      it "filters tasks by architecture" do
        expect(PromptTask.by_architecture("chain_of_thought").pluck(:id)).to contain_exactly(cot_task.id)
        expect(PromptTask.by_architecture("meta_cognitive").pluck(:id)).to contain_exactly(meta_task.id)
      end
    end

    describe ".single_agent" do
      let!(:multi_task) { create(:prompt_task, :multi_agent) }

      it "filters single agent tasks" do
        single_task_ids = PromptTask.single_agent.pluck(:id)
        expect(single_task_ids).to include(task1.id, task2.id, task3.id)
        expect(single_task_ids).not_to include(multi_task.id)
      end
    end

    describe ".multi_agent" do
      let!(:multi_task) { create(:prompt_task, :multi_agent) }

      it "filters multi agent tasks" do
        expect(PromptTask.multi_agent.pluck(:id)).to contain_exactly(multi_task.id)
      end
    end
  end

  describe "callbacks" do
    describe "before_validation :set_defaults" do
      it "sets default values for new single_agent task" do
        task = PromptTask.new(original_prompt: "Test prompt", improvement_type: :single_agent)
        task.valid?

        expect(task.status).to eq("pending")
        expect(task.provider).to eq("google")
        expect(task.ai_model).to eq("gemini-1.5-pro")
        expect(task.architecture).to eq("auto")
        expect(task.max_rounds).to be_nil
      end

      it "sets default values for new multi_agent task" do
        task = PromptTask.new(original_prompt: "Test prompt", improvement_type: :multi_agent)
        task.valid?

        expect(task.status).to eq("pending")
        expect(task.provider).to eq("google")
        expect(task.ai_model).to eq("gemini-1.5-pro")
        expect(task.max_rounds).to eq(5)
        expect(task.architecture).to be_nil
      end
    end
  end

  describe "instance methods" do
    let(:task) { create(:prompt_task) }

    describe "#processing_time" do
      it "returns nil when no start or completion time" do
        expect(task.processing_time).to be_nil
      end

      it "calculates processing time when both times present" do
        task.update!(started_at: 2.hours.ago, completed_at: 1.hour.ago)
        expect(task.processing_time).to be_within(1.second).of(1.hour)
      end
    end

    describe "#in_progress?" do
      it "returns true for processing status" do
        task.update!(status: :processing)
        expect(task.in_progress?).to be true
      end

      it "returns false for other statuses" do
        task.update!(status: :pending)
        expect(task.in_progress?).to be false
      end
    end

    describe "#finished?" do
      it "returns true for completed status" do
        task.update!(status: :completed)
        expect(task.finished?).to be true
      end

      it "returns true for failed status" do
        task.update!(status: :failed)
        expect(task.finished?).to be true
      end

      it "returns false for pending/processing status" do
        task.update!(status: :pending)
        expect(task.finished?).to be false

        task.update!(status: :processing)
        expect(task.finished?).to be false
      end
    end

    describe "#single_agent?" do
      it "returns true for single_agent type" do
        task.update!(improvement_type: :single_agent)
        expect(task.single_agent?).to be true
      end

      it "returns false for multi_agent type" do
        task.update!(improvement_type: :multi_agent)
        expect(task.single_agent?).to be false
      end
    end

    describe "#multi_agent?" do
      it "returns false for single_agent type" do
        task.update!(improvement_type: :single_agent)
        expect(task.multi_agent?).to be false
      end

      it "returns true for multi_agent type" do
        task.update!(improvement_type: :multi_agent)
        expect(task.multi_agent?).to be true
      end
    end

    describe "#architecture_display_name" do
      it "returns nil when no architecture" do
        # Create multi_agent task which doesn't get auto architecture
        multi_task = create(:prompt_task, :multi_agent)
        expect(multi_task.architecture_display_name).to be_nil
      end

      it "formats architecture name" do
        task.update!(architecture: "chain_of_thought")
        expect(task.architecture_display_name).to eq("Chain Of Thought")
      end

      it "formats 5_tier_framework correctly" do
        task.update!(architecture: "5_tier_framework")
        expect(task.architecture_display_name).to eq("5 Tier Framework")
      end
    end
  end

  describe "VALID_ARCHITECTURES constant" do
    it "includes all expected architectures" do
      expect(PromptTask::VALID_ARCHITECTURES).to eq(%w[auto chain_of_thought meta_cognitive 5_tier_framework])
    end
  end
end
