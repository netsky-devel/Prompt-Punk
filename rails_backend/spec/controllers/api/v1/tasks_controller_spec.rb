require "rails_helper"

RSpec.describe Api::V1::TasksController, type: :controller do
  let(:valid_single_agent_params) do
    {
      task: {
        original_prompt: "Create a guide for AI development",
        provider: "google",
        ai_model: "gemini-1.5-pro",
        improvement_type: "single_agent",
        architecture: "auto",
        context: "Software development",
        target_audience: "Developers",
      },
    }
  end

  let(:valid_multi_agent_params) do
    {
      task: {
        original_prompt: "Write a marketing strategy",
        provider: "google",
        ai_model: "gemini-1.5-pro",
        improvement_type: "multi_agent",
        max_rounds: 3,
        context: "Business context",
        target_audience: "Marketing professionals",
      },
    }
  end

  let(:invalid_params) do
    {
      task: {
        original_prompt: "Short",  # Too short
        provider: "",
        ai_model: "",
        improvement_type: "invalid_type",
      },
    }
  end

  describe "POST #create" do
    context "with valid single_agent parameters" do
      it "creates a new single_agent task" do
        expect {
          post :create, params: valid_single_agent_params
        }.to change(PromptTask, :count).by(1)
      end

      it "enqueues SingleAgentJob" do
        expect(SingleAgentJob).to receive(:perform_later).with(
          instance_of(Integer),
          hash_including(provider: "google"),
          hash_including(architecture: "auto")
        )

        post :create, params: valid_single_agent_params
      end

      it "returns task data with created status" do
        post :create, params: valid_single_agent_params

        expect(response).to have_http_status(:created)
        expect(json_response[:success]).to be true
        expect(json_response[:data]).to include(
          :task_id,
          :status,
          :original_prompt,
          :improvement_type,
          :architecture
        )
      end
    end

    context "with valid multi_agent parameters" do
      it "creates a new multi_agent task" do
        expect {
          post :create, params: valid_multi_agent_params
        }.to change(PromptTask, :count).by(1)
      end

      it "enqueues MultiAgentJob" do
        expect(MultiAgentJob).to receive(:perform_later).with(
          instance_of(Integer),
          hash_including(provider: "google")
        )

        post :create, params: valid_multi_agent_params
      end

      it "sets correct attributes for multi_agent task" do
        post :create, params: valid_multi_agent_params

        task = PromptTask.last
        expect(task.improvement_type).to eq("multi_agent")
        expect(task.max_rounds).to eq(3)
        expect(task.architecture).to be_nil
      end
    end

    context "with invalid parameters" do
      it "does not create a task" do
        expect {
          post :create, params: invalid_params
        }.not_to change(PromptTask, :count)
      end

      it "returns validation errors" do
        post :create, params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:success]).to be false
        expect(json_response[:error]).to be_present
        expect(json_response[:details]).to be_present
      end
    end

    context "with architecture parameter" do
      %w[auto chain_of_thought meta_cognitive 5_tier_framework].each do |architecture|
        it "accepts #{architecture} architecture" do
          params = valid_single_agent_params.deep_dup
          params[:task][:architecture] = architecture

          post :create, params: params

          expect(response).to have_http_status(:created)
          expect(PromptTask.last.architecture).to eq(architecture)
        end
      end

      it "rejects invalid architecture" do
        params = valid_single_agent_params.deep_dup
        params[:task][:architecture] = "invalid_architecture"

        post :create, params: params

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "GET #show" do
    let!(:task) { create(:prompt_task) }

    it "returns task data" do
      get :show, params: { id: task.id }

      expect(response).to have_http_status(:ok)
      expect(json_response[:success]).to be true
      expect(json_response[:data][:task_id]).to eq(task.id)
    end

    it "returns 404 for non-existent task" do
      get :show, params: { id: 99999 }

      expect(response).to have_http_status(:not_found)
      expect(json_response[:error]).to eq("Record not found")
      expect(json_response[:message]).to be_present
    end
  end

  describe "GET #status" do
    let!(:task) { create(:prompt_task, :processing) }

    it "returns task status" do
      get :status, params: { id: task.id }

      expect(response).to have_http_status(:ok)
      expect(json_response[:data]).to include(
        :task_id,
        :status,
        :progress,
        :started_at,
        :processing_time
      )
    end

    context "with multi_agent task" do
      let!(:multi_task) { create(:prompt_task, :multi_agent, :processing) }
      let!(:session) { create(:multi_agent_session, prompt_task: multi_task) }

      it "includes multi_agent specific progress" do
        get :status, params: { id: multi_task.id }

        expect(json_response[:data]).to include(
          :current_round,
          :max_rounds,
          :rounds_completed,
          :session_progress
        )
      end
    end
  end

  describe "GET #result" do
    let!(:completed_task) { create(:prompt_task, :completed) }
    let!(:improvement) { create(:prompt_improvement, prompt_task: completed_task) }

    it "returns task result for completed task" do
      get :result, params: { id: completed_task.id }

      expect(response).to have_http_status(:ok)
      expect(json_response[:data]).to include(:task, :improvement)
      expect(json_response[:data][:task]).to include(:task_id, :status)
      expect(json_response[:data][:improvement]).to include(:improved_prompt, :quality_score)
    end

    it "returns error for non-completed task" do
      pending_task = create(:prompt_task, :pending)

      get :result, params: { id: pending_task.id }

      expect(response).to have_http_status(:conflict)
      expect(json_response[:success]).to be false
      expect(json_response[:error]).to be_present
    end
  end

  describe "GET #index" do
    let!(:tasks) { create_list(:prompt_task, 3) }

    it "returns paginated tasks" do
      get :index

      expect(response).to have_http_status(:ok)
      expect(json_response[:data][:tasks]).to be_an(Array)
      expect(json_response[:data][:total]).to eq(3)
    end

    it "filters by status" do
      completed_task = create(:prompt_task, :completed)

      get :index, params: { status: "completed" }

      tasks_data = json_response[:data][:tasks]
      expect(tasks_data.length).to eq(1)
      expect(tasks_data.first[:task_id]).to eq(completed_task.id)
    end

    it "filters by provider" do
      openai_task = create(:prompt_task, provider: "openai")

      get :index, params: { provider: "openai" }

      tasks_data = json_response[:data][:tasks]
      expect(tasks_data.length).to eq(1)
      expect(tasks_data.first[:task_id]).to eq(openai_task.id)
    end
  end

  describe "GET #recent" do
    let!(:old_task) { create(:prompt_task, created_at: 2.days.ago) }
    let!(:recent_tasks) { create_list(:prompt_task, 5, created_at: 1.hour.ago) }

    it "returns recent tasks limited to 10" do
      get :recent

      expect(response).to have_http_status(:ok)
      expect(json_response[:data]).to be_an(Array)
      expect(json_response[:data].length).to eq(6) # 5 recent + 1 old
    end

    it "orders by creation date descending" do
      get :recent

      created_ats = json_response[:data].map { |task| Time.parse(task[:created_at]) }

      # Check that tasks are ordered by created_at descending
      expect(created_ats).to eq(created_ats.sort.reverse)
    end
  end

  private

  def json_response
    JSON.parse(response.body).with_indifferent_access
  end
end
