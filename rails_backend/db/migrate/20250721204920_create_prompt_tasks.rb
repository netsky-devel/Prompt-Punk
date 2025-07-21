class CreatePromptTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :prompt_tasks do |t|
      t.text :original_prompt
      t.string :provider
      t.string :ai_model
      t.integer :improvement_type
      t.integer :status
      t.integer :max_rounds
      t.text :context
      t.string :target_audience
      t.datetime :started_at
      t.datetime :completed_at
      t.text :error_message

      t.timestamps
    end
  end
end
