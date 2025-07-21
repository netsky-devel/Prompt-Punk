class AddArchitectureToPromptTasks < ActiveRecord::Migration[8.0]
  def change
    add_column :prompt_tasks, :architecture, :string
  end
end
