class CreateMultiAgentSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :multi_agent_sessions do |t|
      t.references :prompt_task, null: false, foreign_key: true
      t.integer :current_round
      t.integer :rounds_completed
      t.json :feedback_history
      t.string :final_decision
      t.json :session_metadata

      t.timestamps
    end
  end
end
