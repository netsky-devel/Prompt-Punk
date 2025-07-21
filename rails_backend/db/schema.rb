# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_07_21_204937) do
  create_table "multi_agent_sessions", force: :cascade do |t|
    t.integer "prompt_task_id", null: false
    t.integer "current_round"
    t.integer "rounds_completed"
    t.json "feedback_history"
    t.string "final_decision"
    t.json "session_metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["prompt_task_id"], name: "index_multi_agent_sessions_on_prompt_task_id"
  end

  create_table "prompt_improvements", force: :cascade do |t|
    t.integer "prompt_task_id", null: false
    t.text "improved_prompt"
    t.json "analysis"
    t.json "improvements_metadata"
    t.string "provider_used"
    t.string "ai_model_used"
    t.string "architecture_used"
    t.integer "quality_score"
    t.float "processing_time_seconds"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["prompt_task_id"], name: "index_prompt_improvements_on_prompt_task_id"
  end

  create_table "prompt_tasks", force: :cascade do |t|
    t.text "original_prompt"
    t.string "provider"
    t.string "ai_model"
    t.integer "improvement_type"
    t.integer "status"
    t.integer "max_rounds"
    t.text "context"
    t.string "target_audience"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "multi_agent_sessions", "prompt_tasks"
  add_foreign_key "prompt_improvements", "prompt_tasks"
end
