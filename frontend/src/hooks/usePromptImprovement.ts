import { useMutation } from 'react-query'
import axios from 'axios'
import type { PromptRequest, PromptResponse, ApiError } from '../types/api'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://localhost:8000'

const improvePromptAPI = async (request: PromptRequest): Promise<PromptResponse> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/improve-prompt`, request)
  return response.data
}

export const usePromptImprovement = () => {
  return useMutation<PromptResponse, ApiError, PromptRequest>(improvePromptAPI, {
    onSuccess: (data) => {
      toast.success(`Prompt improved using ${data.provider_used} ${data.model_used}!`)
    },
    onError: (error) => {
      const errorMessage = error.detail || 'Error occurred while improving prompt'
      toast.error(errorMessage)
    },
  })
} 