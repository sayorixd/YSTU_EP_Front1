// app/api/competencies.ts
import { Competence } from '@/app/types'

const API_BASE_URL = 'http://localhost:8001'

export const competenciesApi = {
  async getAll(): Promise<Competence[]> {
    const response = await fetch(`${API_BASE_URL}/competencies/`)
    if (!response.ok) throw new Error('Ошибка загрузки компетенций')
    return response.json()
  },

  async getById(id: number): Promise<Competence> {
    const response = await fetch(`${API_BASE_URL}/competencies/${id}`)
    if (!response.ok) throw new Error('Компетенция не найдена')
    return response.json()
  },

  async create(data: Omit<Competence, 'id'>): Promise<Competence> {
    const response = await fetch(`${API_BASE_URL}/competencies/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Ошибка создания компетенции')
    return response.json()
  },

  async update(id: number, data: Partial<Competence>): Promise<Competence> {
    const response = await fetch(`${API_BASE_URL}/competencies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Ошибка обновления компетенции')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/competencies/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Ошибка удаления компетенции')
  }
}