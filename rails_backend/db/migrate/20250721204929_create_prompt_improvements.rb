class CreatePromptImprovements < ActiveRecord::Migration[8.0]
  def change
    create_table :prompt_improvements do |t|
      t.references :prompt_task, null: false, foreign_key: true
      t.text :improved_prompt
      t.json :analysis
      t.json :improvements_metadata
      t.string :provider_used
      t.string :ai_model_used
      t.string :architecture_used
      t.integer :quality_score
      t.float :processing_time_seconds

      t.timestamps
    end
  end
end
