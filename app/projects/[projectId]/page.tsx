'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
// Note os dois pontos extras aqui embaixo para subir as pastas corretamente
import PromptComponent from '../../components/prompt-component'
import ApiKeyError from '../../components/api-key-error'
import RateLimitDialog from '../../components/rate-limit-dialog'
import ErrorDialog from '../../components/error-dialog'
import { useApiValidation } from '../../../lib/hooks/useApiValidation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Estados da UI
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)
  const [selectedChatId, setSelectedChatId] = useState('new')
  const [projectChats, setProjectChats] = useState<any[]>([])
  
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ resetTime?: string; remaining?: number }>({})
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { isValidating, showApiKeyError } = useApiValidation()

  useEffect(() => {
    if (!isValidating && !showApiKeyError && projectId) {
      loadProjectData(projectId)
    }
  }, [isValidating, showApiKeyError, projectId])

  const loadProjectData = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProjectChats(data.chats || [])
        setSelectedProjectId(id)
        setProjectsLoaded(true)
      }
    } catch (err) {
      console.error("Erro ao carregar dados do projeto")
    }
  }

  const handleSubmit = async (prompt: string, settings: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt, 
          projectId: projectId,
          ...settings 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Erro na geração')
        setShowErrorDialog(true)
        return
      }

      const data = await response.json()
      router.push(`/projects/${projectId}/chats/${data.id || data.chatId}`)
    } catch (err) {
      setErrorMessage('Erro de conexão')
      setShowErrorDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (showApiKeyError) return <ApiKeyError />

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-4" style={{ transform: 'translateY(-25%)' }}>
          <h1 className="text-4xl font-bold mb-4 italic text-zinc-500">
            Project: {projectId}
          </h1>
        </div>
      </div>

      <PromptComponent
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Continue editando seu projeto..."
        showDropdowns={projectsLoaded}
        projects={projects}
        projectChats={projectChats}
        currentProjectId={selectedProjectId}
        currentChatId={selectedChatId}
        onProjectChange={(id) => id === 'new' ? router.push('/dashboard') : router.push(`/projects/${id}`)}
        onChatChange={(id) => setSelectedChatId(id)}
      />

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
