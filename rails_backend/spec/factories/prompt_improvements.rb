FactoryBot.define do
  factory :prompt_improvement do
    prompt_task { nil }
    improved_prompt { "MyText" }
    analysis { "" }
    improvements_metadata { "" }
    provider_used { "MyString" }
    ai_model_used { "MyString" }
    architecture_used { "MyString" }
    quality_score { 1 }
    processing_time_seconds { 1.5 }
  end
end
