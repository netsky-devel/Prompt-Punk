class PromptTask < ApplicationRecord
  # Enums
  enum :status, {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
  }

  enum :improvement_type, {
    single_agent: "single_agent",
    multi_agent: "multi_agent",
  }

  # Architecture types for single_agent improvement
  VALID_ARCHITECTURES = %w[auto chain_of_thought meta_cognitive 5_tier_framework].freeze

  # Associations
  has_one :prompt_improvement, dependent: :destroy
  has_one :multi_agent_session, dependent: :destroy

  # Validations
  validates :original_prompt, presence: true, length: { minimum: 10, maximum: 10000 }
  validates :status, presence: true, inclusion: { in: statuses.keys }
  validates :improvement_type, presence: true, inclusion: { in: improvement_types.keys }
  validates :provider, presence: true, length: { maximum: 50 }
  validates :ai_model, presence: true, length: { maximum: 100 }
  validates :max_rounds, numericality: { greater_than: 0, less_than_or_equal_to: 20 }, allow_nil: true
  validates :context, length: { maximum: 1000 }, allow_blank: true
  validates :target_audience, length: { maximum: 500 }, allow_blank: true
  validates :architecture, inclusion: { in: VALID_ARCHITECTURES }, allow_blank: true

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_provider, ->(provider) { where(provider: provider) }
  scope :by_architecture, ->(architecture) { where(architecture: architecture) }
  scope :single_agent, -> { where(improvement_type: "single_agent") }
  scope :multi_agent, -> { where(improvement_type: "multi_agent") }

  # Callbacks
  before_validation :set_defaults
  before_save :update_processing_time

  # Instance methods
  def processing_time
    return nil unless started_at && completed_at
    completed_at - started_at
  end

  def in_progress?
    status == "processing"
  end

  def finished?
    ["completed", "failed"].include?(status)
  end

  def single_agent?
    improvement_type == "single_agent"
  end

  def multi_agent?
    improvement_type == "multi_agent"
  end

  def architecture_display_name
    return nil unless architecture.present?
    architecture.gsub("_", " ").titleize
  end

  private

  def set_defaults
    self.status ||= "pending"
    self.provider ||= "google"
    self.ai_model ||= "gemini-1.5-pro"
    self.max_rounds ||= 5 if multi_agent?
    self.architecture ||= "auto" if single_agent?
  end

  def update_processing_time
    if status_changed? && completed?
      self.completed_at = Time.current if completed_at.blank?
      self.started_at = Time.current if started_at.blank?
    end
  end
end
