class PromptImprovement < ApplicationRecord
  # Associations
  belongs_to :prompt_task

  # Validations
  validates :improved_prompt, presence: true, length: { minimum: 10 }
  validates :provider_used, presence: true
  validates :ai_model_used, presence: true
  validates :quality_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :processing_time_seconds, numericality: { greater_than: 0 }, allow_nil: true

  # Scopes
  scope :high_quality, -> { where("quality_score >= ?", 80) }
  scope :by_provider, ->(provider) { where(provider_used: provider) }
  scope :recent, -> { joins(:prompt_task).order("prompt_tasks.created_at DESC") }

  # Instance methods
  def quality_rating
    case quality_score
    when 90..100 then "excellent"
    when 80..89 then "good"
    when 70..79 then "acceptable"
    when 60..69 then "poor"
    else "very_poor"
    end
  end

  def quality_emoji
    case quality_rating
    when "excellent" then "🏆"
    when "good" then "⭐"
    when "acceptable" then "📊"
    when "poor" then "📉"
    else "🔴"
    end
  end

  def formatted_processing_time
    return "N/A" unless processing_time_seconds

    if processing_time_seconds < 60
      "#{processing_time_seconds.round(1)}s"
    else
      minutes = (processing_time_seconds / 60).round(1)
      "#{minutes}m"
    end
  end

  def analysis_summary
    return "No analysis available" unless analysis.present?

    analysis.dig("main_goal") || "Analysis completed"
  end
end
