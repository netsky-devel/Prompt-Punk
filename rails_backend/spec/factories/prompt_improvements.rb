FactoryBot.define do
  factory :prompt_improvement do
    prompt_task { create(:prompt_task) }
    improved_prompt { "This is an improved version of the original prompt with much better clarity and structure." }
    analysis { '{"main_goal": "Improve prompt clarity", "identified_problems": ["vague wording"], "improvement_potential": "High"}' }
    improvements_metadata { '{"applied_techniques": [{"name": "Clarity enhancement", "description": "Improved wording"}], "quality_score": 85}' }
    provider_used { "google" }
    ai_model_used { "gemini-1.5-pro" }
    architecture_used { "auto" }
    quality_score { 85 }
    processing_time_seconds { 2.5 }
  end
end
