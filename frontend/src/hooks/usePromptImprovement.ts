import { useMutation } from 'react-query'
import axios from 'axios'
import { PromptRequest, PromptResponse, ApiError } from '../types/api'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://localhost:8000'

const improvePromptAPI = async (request: PromptRequest): Promise<PromptResponse> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/improve-prompt`, request)
  return response.data
}

export const usePromptImprovement = () => {
  return useMutation<PromptResponse, ApiError, PromptRequest>(improvePromptAPI, {
    onSuccess: () => {
      toast.success('Промпт успешно улучшен!')
    },
    onError: (error) => {
      const errorMessage = error.detail || 'Произошла ошибка при улучшении промпта'
      toast.error(errorMessage)
    },
  })
} 