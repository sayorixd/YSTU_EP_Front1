// app/api/disciplineBlockCompetencies.ts
const API_BASE_URL = 'http://localhost:8001'

export interface DisciplineBlockCompetency {
  id: number
  discipline_block_id: number
  competency_id: number
}

export const disciplineBlockCompetenciesApi = {
  async getAll(): Promise<DisciplineBlockCompetency[]> {
    const response = await fetch(`${API_BASE_URL}/discipline-block-competencies/`)
    if (!response.ok) throw new Error('Ошибка загрузки связей')
    return response.json()
  },

  async getByDisciplineBlock(disciplineBlockId: number): Promise<DisciplineBlockCompetency[]> {
    const all = await this.getAll()
    return all.filter(item => item.discipline_block_id === disciplineBlockId)
  },

  async create(disciplineBlockId: number, competencyId: number): Promise<DisciplineBlockCompetency> {
    const response = await fetch(`${API_BASE_URL}/discipline-block-competencies/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discipline_block_id: disciplineBlockId,
        competency_id: competencyId
      })
    })
    if (!response.ok) throw new Error('Ошибка создания связи')
    return response.json()
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/discipline-block-competencies/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Ошибка удаления связи')
  },

  async deleteByDisciplineBlock(disciplineBlockId: number): Promise<void> {
    const connections = await this.getByDisciplineBlock(disciplineBlockId)
    await Promise.all(connections.map(conn => this.delete(conn.id)))
  }
}