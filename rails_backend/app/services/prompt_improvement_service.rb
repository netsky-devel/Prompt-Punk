# This service is deprecated - use MultiAgentService instead
# All prompt improvement now goes through the multi-agent workflow

class PromptImprovementService
  def self.call(*args)
    raise NotImplementedError, "Use MultiAgentService instead - single agents are deprecated"
  end
end
