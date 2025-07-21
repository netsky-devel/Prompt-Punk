FactoryBot.define do
  factory :multi_agent_session do
    prompt_task { create(:prompt_task, :multi_agent) }
    current_round { 1 }
    rounds_completed { 1 }
    feedback_history { '{"round_1": {"feedback": "Good start", "recommendation": "Continue"}}' }
    final_decision { "continue" }
    session_metadata { '{"total_rounds": 3, "collaboration_quality": "good"}' }
  end
end
