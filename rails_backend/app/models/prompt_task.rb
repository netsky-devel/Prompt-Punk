class PromptTask < ApplicationRecord
  # Enums
  enum :status, {
    pending: 0,
    processing: 1,
    completed: 2,
    failed: 3,
  }

  enum :improvement_type, {
    single_agent: 0,
    multi_agent: 1,
  }

  # Associations
  has_one :prompt_improvement, dependent: :destroy
  has_one :multi_agent_session, dependent: :destroy

  # Validations
  validates :original_prompt, presence: true, length: { minimum: 10, maximum: 10000 }
  validates :provider, inclusion: { in: %w[openai anthropic google] }
  validates :ai_model, presence: true
  validates :improvement_type, presence: true
  validates :max_rounds, numericality: { greater_than: 0, less_than_or_equal_to: 10 }, allow_nil: true

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_provider, ->(provider) { where(provider: provider) }

  # Callbacks
  before_validation :set_defaults
  before_save :update_processing_time

  # Instance methods
  def processing_time
    return nil unless completed_at && started_at
    completed_at - started_at
  end

  def in_progress?
    processing?
  end

  def finished?
    completed? || failed?
  end

  private

  def set_defaults
    self.max_rounds ||= 3 if multi_agent?
    self.status ||= :pending
  end

  def update_processing_time
    if status_changed? && processing?
      self.started_at = Time.current
    elsif status_changed? && finished?
      self.completed_at = Time.current
    end
  end
end
