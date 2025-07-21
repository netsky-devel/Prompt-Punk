class MultiAgentSession < ApplicationRecord
  # Associations
  belongs_to :prompt_task

  # Validations
  validates :current_round, numericality: { greater_than_or_equal_to: 0 }
  validates :rounds_completed, numericality: { greater_than_or_equal_to: 0 }
  validates :final_decision, inclusion: { in: %w[approve reject continue pending] }, allow_blank: true

  # Scopes
  scope :active, -> { where(final_decision: [nil, "continue", "pending"]) }
  scope :completed, -> { where(final_decision: ["approve", "reject"]) }
  scope :by_decision, ->(decision) { where(final_decision: decision) }

  # Instance methods
  def active?
    final_decision.nil? || %w[continue pending].include?(final_decision)
  end

  def completed?
    %w[approve reject].include?(final_decision)
  end

  def approved?
    final_decision == "approve"
  end

  def rejected?
    final_decision == "reject"
  end

  def feedback_count
    return 0 unless feedback_history.present?
    feedback_history.is_a?(Array) ? feedback_history.length : 0
  end

  def latest_feedback
    return nil unless feedback_history.present? && feedback_history.is_a?(Array)
    feedback_history.last
  end

  def latest_recommendation
    latest_feedback&.dig("recommendation") || "N/A"
  end

  def progress_percentage
    return 0 unless prompt_task&.max_rounds&.positive?
    [(current_round.to_f / prompt_task.max_rounds * 100).round, 100].min
  end

  def add_feedback(round, agent, feedback_data)
    self.feedback_history ||= []

    feedback_entry = {
      "round" => round,
      "agent" => agent,
      "timestamp" => Time.current.iso8601,
      "feedback" => feedback_data,
    }

    if feedback_data.is_a?(Hash)
      feedback_entry.merge!(feedback_data)
    else
      feedback_entry["content"] = feedback_data
    end

    self.feedback_history << feedback_entry
    save!
  end

  def session_summary
    {
      rounds_completed: rounds_completed,
      current_round: current_round,
      final_decision: final_decision,
      feedback_count: feedback_count,
      latest_recommendation: latest_recommendation,
      progress_percentage: progress_percentage,
      status: active? ? "active" : "completed",
    }
  end
end
