#!/usr/bin/env ruby

# Test script for MultiAgentJob
require_relative "config/environment"

puts "🤖 Testing MultiAgentJob with Mock Providers"
puts "=" * 50

# Create test task for multi-agent
task = PromptTask.create!(
  original_prompt: "Explain machine learning concepts",
  provider: "google",
  ai_model: "gemini-1.5-pro",
  improvement_type: :multi_agent,
  max_rounds: 3,
  context: "Educational content for beginners",
  target_audience: "College students",
)

puts "📝 Multi-Agent Task:"
puts "  ID: #{task.id}"
puts "  Prompt: #{task.original_prompt}"
puts "  Max Rounds: #{task.max_rounds}"
puts "  Status: #{task.status}"
puts

# Mock provider config
provider_config = {
  provider: "mock_test",
  model: "test-model",
  api_key: "test_key",
}

puts "🔧 Starting MultiAgentJob with Mock Providers..."
puts "  🎭 PromptEngineerAgent → ReviewerAgent → LeadAgent"
puts

begin
  job = MultiAgentJob.new
  job.perform(task.id, provider_config)
  puts "✅ MultiAgent workflow completed successfully!"
rescue => e
  puts "❌ MultiAgent workflow failed: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end

# Check results
task.reload
puts
puts "📊 Task Results:"
puts "  Task Status: #{task.status}"
puts "  Started At: #{task.started_at}"
puts "  Completed At: #{task.completed_at}"
puts "  Processing Time: #{task.processing_time&.round(2)}s"

# Check multi-agent session
if task.multi_agent_session
  session = task.multi_agent_session
  puts
  puts "🔄 Multi-Agent Session:"
  puts "  Rounds Completed: #{session.rounds_completed}"
  puts "  Final Decision: #{session.final_decision}"
  puts "  Feedback Count: #{session.feedback_count}"
  puts "  Progress: #{session.progress_percentage}%"

  if session.feedback_history.present?
    puts
    puts "📝 Feedback History:"
    session.feedback_history.each_with_index do |feedback, i|
      puts "    #{i + 1}. #{feedback["agent"]} (Round #{feedback["round"]}):"
      puts "       Action: #{feedback["action"]}"
      if feedback["recommendation"]
        puts "       Recommendation: #{feedback["recommendation"]}"
      end
      if feedback["decision"]
        puts "       Decision: #{feedback["decision"]}"
      end
    end
  end
end

# Check improvement
if task.prompt_improvement
  improvement = task.prompt_improvement
  puts
  puts "✨ Final Improvement:"
  puts "  Quality Score: #{improvement.quality_score} #{improvement.quality_emoji}"
  puts "  Provider Used: #{improvement.provider_used}"
  puts "  Architecture: #{improvement.architecture_used}"
  puts
  puts "📝 Final Improved Prompt:"
  puts improvement.improved_prompt
  puts
  puts "🔍 Multi-Agent Analysis:"
  if improvement.analysis.present?
    analysis = improvement.analysis
    puts "  Main Goal: #{analysis["main_goal"]}"
    puts "  Rounds: #{analysis["session_summary"]["rounds_completed"] rescue "N/A"}"
    puts "  Final Decision: #{analysis["final_decision"]}"
    puts "  Collaboration Quality: #{analysis["session_summary"]["collaboration_quality"] rescue "N/A"}"
  end
else
  puts "  No improvement found!"
end

puts
puts "🏁 Multi-Agent test completed!"
