FactoryBot.define do
  factory :prompt_task do
    original_prompt { "MyText" }
    provider { "MyString" }
    ai_model { "MyString" }
    improvement_type { 1 }
    status { 1 }
    max_rounds { 1 }
    context { "MyText" }
    target_audience { "MyString" }
    started_at { "2025-07-21 23:49:20" }
    completed_at { "2025-07-21 23:49:20" }
    error_message { "MyText" }
  end
end
