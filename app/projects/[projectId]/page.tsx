'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PromptComponent from '../components/prompt-component'
import ApiKeyError from '../components/api-key-error'
import RateLimitDialog from '../components/rate-limit-dialog'
import ErrorDialog from '../components/error-dialog'
import { useApiValidation } from '../../lib/hooks/useApiValidation'

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  
  // Estados da UI
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('new')
  const [selectedChatId, setSelectedChatId] = useState('new')
  const [projectChats, setProjectChats] = useState<any[]>([])
  
  // Estados de Erro e Rate Limit
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ resetTime?: string; remaining?: number }>({})
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Validação da API (Hook personalizado)
  const { isValidating, showApiKeyError } = useApiValidation()

  // Carregar projetos ao montar a página
  useEffect(() => {
    if (!isValidating && !showApiKeyError) {
      loadProjects()
    }
  }, [isValidating, showApiKeyError])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.data || data || [])
        setProjectsLoaded(true)
      }
    } catch (err) {
      console.error("Erro ao carregar projetos")
    }
  }

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId === 'new') {
      setSelectedProjectId('new')
      setSelectedChatId('new')
      setProjectChats([])
    } else {
      router.push(`/projects/${newProjectId}`)
    }
  }

  const handleSubmit = async (
    prompt: string,
    settings: { modelId: string; imageGenerations: boolean; thinking: boolean },
    attachments?: { url: string; name?: string; type?: string }[]
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          modelId: settings.modelId,
          imageGenerations: settings.imageGenerations,
          thinking: settings.thinking,
          ...(attachments && attachments.length > 0 && { attachments }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          setRateLimitInfo(errorData)
          setShowRateLimitDialog(true)
        } else {
          setErrorMessage(errorData.error || 'Falha ao gerar resposta')
          setShowErrorDialog(true)
        }
        return
      }

      const data = await response.json()
      const newChatId = data.id || data.chatId
      const projectId = data.projectId || 'default'
      
      router.push(`/projects/${projectId}/chats/${newChatId}`)
    } catch (err) {
      setErrorMessage('Erro de conexão com o servidor')
      setShowErrorDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (showApiKeyError) return <ApiKeyError />

  return (
    <div className="relative min-h-dvh bg-background">
      {/* Mensagem de Boas-vindas ao centro */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-4" style={{ transform: 'translateY(-25%)' }}>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            My IA 0V
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie sua aplicação com inteligência artificial.
          </p>
        </div>
      </div>

      {/* Componente de Input de Prompt */}
      <PromptComponent
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Descreva o que você quer criar..."
        showDropdowns={projectsLoaded}
        projects={projects}
        projectChats={projectChats}
        currentProjectId={selectedProjectId}
        currentChatId={selectedChatId}
        onProjectChange={handleProjectChange}
        onChatChange={(id) => setSelectedChatId(id)}
      />

      {/* Diálogos de Erro e Limite */}
      <RateLimitDialog
        isOpen={showRateLimitDialog}
        onClose={() => setShowRateLimitDialog(false)}
        resetTime={rateLimitInfo.resetTime}
        remaining={rateLimitInfo.remaining}
      />

      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        message={errorMessage}
      />
    </div>
  )
}
