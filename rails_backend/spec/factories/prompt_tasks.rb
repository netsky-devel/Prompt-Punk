FactoryBot.define do
  factory :prompt_task do
    original_prompt { "Create a comprehensive guide for AI prompt engineering" }
    provider { "google" }
    ai_model { "gemini-1.5-pro" }
    improvement_type { :single_agent }
    status { :pending }
    max_rounds { 5 }
    context { "Professional development context" }
    target_audience { "AI developers and engineers" }
    architecture { "auto" }

    trait :single_agent do
      improvement_type { :single_agent }
      architecture { "auto" }
      max_rounds { nil }
    end

    trait :multi_agent do
      improvement_type { :multi_agent }
      architecture { nil }
      max_rounds { 5 }
    end

    trait :processing do
      status { :processing }
      started_at { 1.hour.ago }
    end

    trait :completed do
      status { :completed }
      started_at { 2.hours.ago }
      completed_at { 1.hour.ago }
    end

    trait :failed do
      status { :failed }
      started_at { 2.hours.ago }
      completed_at { 1.hour.ago }
      error_message { "AI provider error: Invalid API key" }
    end

    trait :chain_of_thought do
      architecture { "chain_of_thought" }
    end

    trait :meta_cognitive do
      architecture { "meta_cognitive" }
    end

    trait :five_tier_framework do
      architecture { "5_tier_framework" }
    end
  end
end
