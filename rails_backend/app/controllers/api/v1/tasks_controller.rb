class Api::V1::TasksController < Api::BaseController
  before_action :set_task, only: [:show, :status, :result]

  # POST /api/v1/tasks
  def create
    @task = PromptTask.new(task_params)

    if @task.save
      # Enqueue background job based on improvement type
      if @task.single_agent?
        SingleAgentJob.perform_later(@task.id, provider_config, architecture_config)
      else
        MultiAgentJob.perform_later(@task.id, provider_config)
      end

      render_success(task_data(@task), :created)
    else
      render_error("Failed to create task", :unprocessable_entity, @task.errors.full_messages)
    end
  end

  # GET /api/v1/tasks/:id
  def show
    render_success(task_data(@task))
  end

  # GET /api/v1/tasks/:id/status
  def status
    data = {
      task_id: @task.id,
      status: @task.status,
      progress: calculate_progress(@task),
      started_at: @task.started_at,
      completed_at: @task.completed_at,
      processing_time: @task.processing_time,
    }

    # Add multi-agent specific progress
    if @task.multi_agent? && @task.multi_agent_session.present?
      session = @task.multi_agent_session
      data.merge!(
        current_round: session.current_round,
        max_rounds: @task.max_rounds,
        rounds_completed: session.rounds_completed,
        latest_feedback: session.latest_feedback,
        session_progress: session.progress_percentage,
      )
    end

    render_success(data)
  end

  # GET /api/v1/tasks/:id/result
  def result
    unless @task.completed?
      return render_error("Task not completed yet", :conflict)
    end

    improvement = @task.prompt_improvement
    unless improvement
      return render_error("No improvement result found", :not_found)
    end

    data = {
      task: task_data(@task),
      improvement: improvement_data(improvement),
    }

    # Add multi-agent session data if applicable
    if @task.multi_agent? && @task.multi_agent_session.present?
      data[:session] = session_data(@task.multi_agent_session)
    end

    render_success(data)
  end

  # GET /api/v1/tasks
  def index
    @tasks = PromptTask.includes(:prompt_improvement, :multi_agent_session)
      .recent
      .limit(params[:limit] || 20)

    # Apply filters
    @tasks = @tasks.by_status(params[:status]) if params[:status].present?
    @tasks = @tasks.by_provider(params[:provider]) if params[:provider].present?

    render_success(
      tasks: @tasks.map { |task| task_data(task) },
      total: @tasks.count,
    )
  end

  # GET /api/v1/tasks/recent
  def recent
    @tasks = PromptTask.includes(:prompt_improvement)
      .recent
      .limit(10)

    render_success(@tasks.map { |task| recent_task_data(task) })
  end

  private

  def set_task
    @task = PromptTask.find(params[:id])
  end

  def task_params
    params.require(:task).permit(
      :original_prompt, :provider, :ai_model, :improvement_type,
      :max_rounds, :context, :target_audience, :architecture
    )
  end

  def provider_config
    {
      provider: params.dig(:task, :provider) || "google",
      model: params.dig(:task, :ai_model) || "gemini-1.5-pro",
      api_key: request.headers["X-API-Key"] || "test_key",
    }
  end

  def architecture_config
    {
      architecture: params.dig(:task, :architecture) || "auto",
      context: params.dig(:task, :context),
      target_audience: params.dig(:task, :target_audience),
    }
  end

  def task_data(task)
    {
      id: task.id,
      original_prompt: task.original_prompt,
      provider: task.provider,
      ai_model: task.ai_model,
      improvement_type: task.improvement_type,
      status: task.status,
      max_rounds: task.max_rounds,
      context: task.context,
      target_audience: task.target_audience,
      started_at: task.started_at,
      completed_at: task.completed_at,
      processing_time: task.processing_time,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }
  end

  def improvement_data(improvement)
    {
      id: improvement.id,
      improved_prompt: improvement.improved_prompt,
      analysis: improvement.analysis,
      improvements_metadata: improvement.improvements_metadata,
      provider_used: improvement.provider_used,
      ai_model_used: improvement.ai_model_used,
      architecture_used: improvement.architecture_used,
      quality_score: improvement.quality_score,
      quality_rating: improvement.quality_rating,
      quality_emoji: improvement.quality_emoji,
      processing_time_seconds: improvement.processing_time_seconds,
      formatted_processing_time: improvement.formatted_processing_time,
    }
  end

  def session_data(session)
    {
      id: session.id,
      current_round: session.current_round,
      rounds_completed: session.rounds_completed,
      final_decision: session.final_decision,
      feedback_history: session.feedback_history,
      feedback_count: session.feedback_count,
      latest_recommendation: session.latest_recommendation,
      progress_percentage: session.progress_percentage,
      session_summary: session.session_summary,
    }
  end

  def recent_task_data(task)
    data = {
      id: task.id,
      status: task.status,
      improvement_type: task.improvement_type,
      provider: task.provider,
      created_at: task.created_at,
      processing_time: task.processing_time,
    }

    if task.prompt_improvement.present?
      improvement = task.prompt_improvement
      data.merge!(
        quality_score: improvement.quality_score,
        quality_emoji: improvement.quality_emoji,
        has_result: true,
      )
    else
      data[:has_result] = false
    end

    data
  end

  def calculate_progress(task)
    return 100 if task.completed?
    return 0 if task.pending?

    if task.multi_agent? && task.multi_agent_session.present?
      task.multi_agent_session.progress_percentage
    else
      task.processing? ? 50 : 0
    end
  end
end
