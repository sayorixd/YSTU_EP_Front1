// app/hooks/useCompetences.ts
import { useState, useEffect, useCallback } from 'react'
import { Competence } from '@/app/types'
import { competenciesApi } from '@/app/api/competencies'
import { disciplineBlockCompetenciesApi } from '@/app/api/disciplineBlockCompetencies'

export const useCompetences = () => {
  const [competences, setCompetences] = useState<Competence[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCompetences = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await competenciesApi.getAll()
      setCompetences(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки компетенций')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCompetencesForBlock = useCallback(async (disciplineBlockId: number) => {
    try {
      const connections = await disciplineBlockCompetenciesApi.getByDisciplineBlock(disciplineBlockId)
      return connections.map(conn => conn.competency_id)
    } catch (err) {
      console.error('Ошибка загрузки компетенций для блока:', err)
      return []
    }
  }, [])

  const updateBlockCompetences = useCallback(async (
    disciplineBlockId: number,
    newCompetenceIds: number[]
  ) => {
    try {
      const currentConnections = await disciplineBlockCompetenciesApi.getByDisciplineBlock(disciplineBlockId)
      const currentCompetenceIds = currentConnections.map(conn => conn.competency_id)
      
      const toAdd = newCompetenceIds.filter(id => !currentCompetenceIds.includes(id))
      const toRemove = currentConnections.filter(conn => !newCompetenceIds.includes(conn.competency_id))
      
      await Promise.all(toAdd.map(compId => 
        disciplineBlockCompetenciesApi.create(disciplineBlockId, compId)
      ))
      
      await Promise.all(toRemove.map(conn => 
        disciplineBlockCompetenciesApi.delete(conn.id)
      ))
      
      return true
    } catch (err) {
      console.error('Ошибка обновления компетенций:', err)
      return false
    }
  }, [])

  useEffect(() => {
    loadCompetences()
  }, [loadCompetences])

  return {
    competences,
    isLoading,
    error,
    loadCompetences,
    getCompetencesForBlock,
    updateBlockCompetences
  }
}