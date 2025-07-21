FactoryBot.define do
  factory :multi_agent_session do
    prompt_task { nil }
    current_round { 1 }
    rounds_completed { 1 }
    feedback_history { "" }
    final_decision { "MyString" }
    session_metadata { "" }
  end
end
