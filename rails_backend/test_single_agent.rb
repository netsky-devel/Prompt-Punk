#!/usr/bin/env ruby

# Test script for SingleAgentJob
require_relative "config/environment"

puts "🚀 Testing SingleAgentJob with Mock Provider"
puts "=" * 50

# Find or create test task
task = PromptTask.find_by(id: 1)
unless task
  task = PromptTask.create!(
    original_prompt: "Write a blog post about AI",
    provider: "google",
    ai_model: "gemini-1.5-pro",
    improvement_type: :single_agent,
    context: "Technology blog for developers",
    target_audience: "Software engineers",
  )
end

puts "📝 Original Task:"
puts "  ID: #{task.id}"
puts "  Prompt: #{task.original_prompt}"
puts "  Provider: #{task.provider}"
puts "  Status: #{task.status}"
puts

# Mock provider config (will use MockAIProvider)
provider_config = {
  provider: "mock_test",
  model: "test-model",
  api_key: "test_key",
}

puts "🔧 Starting SingleAgentJob with Mock Provider..."
begin
  job = SingleAgentJob.new
  job.perform(task.id, provider_config)
  puts "✅ Job completed successfully!"
rescue => e
  puts "❌ Job failed: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end

# Check results
task.reload
puts
puts "📊 Results:"
puts "  Task Status: #{task.status}"
puts "  Started At: #{task.started_at}"
puts "  Completed At: #{task.completed_at}"

if task.prompt_improvement
  improvement = task.prompt_improvement
  puts
  puts "✨ Improvement Details:"
  puts "  Quality Score: #{improvement.quality_score} #{improvement.quality_emoji}"
  puts "  Provider Used: #{improvement.provider_used}"
  puts "  Architecture: #{improvement.architecture_used}"
  puts
  puts "📝 Improved Prompt:"
  puts improvement.improved_prompt
  puts
  puts "🔍 Analysis:"
  puts improvement.analysis.inspect if improvement.analysis.present?
else
  puts "  No improvement found!"
end

puts
puts "�� Test completed!"
