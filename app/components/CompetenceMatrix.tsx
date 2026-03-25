// app/components/CompetenceMatrix.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { DisciplineBlock, Competence } from '@/app/types'
import { useCompetences } from '@/app/hooks/useCompetences'

interface CompetenceMatrixProps {
  disciplineBlocks: DisciplineBlock[]
  readOnly?: boolean
  onCompetencesChange?: (blockId: number, competenceIds: number[]) => void
}

export const CompetenceMatrix: React.FC<CompetenceMatrixProps> = ({
  disciplineBlocks,
  readOnly = false,
  onCompetencesChange
}) => {
  const { competences, getCompetencesForBlock, updateBlockCompetences } = useCompetences()
  const [blockCompetences, setBlockCompetences] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [filterText, setFilterText] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const loadAllCompetences = async () => {
      setLoading(true)
      const newBlockCompetences: Record<number, number[]> = {}
      
      for (const block of disciplineBlocks) {
        const compIds = await getCompetencesForBlock(block.id)
        newBlockCompetences[block.id] = compIds
      }
      
      setBlockCompetences(newBlockCompetences)
      setLoading(false)
    }
    
    if (disciplineBlocks.length > 0 && competences.length > 0) {
      loadAllCompetences()
    } else if (disciplineBlocks.length === 0) {
      setLoading(false)
    }
  }, [disciplineBlocks, competences, getCompetencesForBlock])

  const handleCompetenceChange = async (blockId: number, competenceId: number, checked: boolean) => {
    if (readOnly) return
    
    setUpdating(blockId)
    const currentCompIds = blockCompetences[blockId] || []
    let newCompIds: number[]
    
    if (checked) {
      newCompIds = [...currentCompIds, competenceId]
    } else {
      newCompIds = currentCompIds.filter(id => id !== competenceId)
    }
    
    setBlockCompetences(prev => ({
      ...prev,
      [blockId]: newCompIds
    }))
    
    if (onCompetencesChange) {
      onCompetencesChange(blockId, newCompIds)
    }
    
    await updateBlockCompetences(blockId, newCompIds)
    setUpdating(null)
  }

  const filteredBlocks = disciplineBlocks.filter(block => 
    block.discipline?.name?.toLowerCase().includes(filterText.toLowerCase()) ||
    block.discipline?.short_name?.toLowerCase().includes(filterText.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c' }}>
        Загрузка матрицы компетенций...
      </div>
    )
  }

  if (disciplineBlocks.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c' }}>
        Нет добавленных дисциплин в учебном плане
      </div>
    )
  }

  if (competences.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c' }}>
        Нет доступных компетенций в системе
      </div>
    )
  }

  return (
    <div className="competence-matrix">
      <style jsx>{`
        .competence-matrix {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          margin-top: 24px;
        }
        
        .matrix-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e8e8e8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .matrix-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .matrix-filter {
          padding: 8px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          width: 250px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
        }
        
        .matrix-filter:focus {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
        }
        
        .matrix-stats {
          font-size: 12px;
          color: #8c8c8c;
          padding: 8px 24px;
          background: #fafafa;
          border-bottom: 1px solid #e8e8e8;
        }
        
        .matrix-table-container {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        
        .matrix-table th,
        .matrix-table td {
          border: 1px solid #e8e8e8;
          padding: 12px;
          text-align: left;
          vertical-align: top;
        }
        
        .matrix-table th {
          background: #fafafa;
          font-weight: 600;
          color: #262626;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
        }
        
        .discipline-cell {
          background: white;
          font-weight: 500;
          min-width: 200px;
          position: sticky;
          left: 0;
          background: white;
          z-index: 5;
        }
        
        .competence-cell {
          text-align: center;
          min-width: 80px;
        }
        
        .checkbox-label {
          display: inline-block;
          cursor: pointer;
          font-size: 18px;
          user-select: none;
        }
        
        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .checkbox-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .empty-state {
          text-align: center;
          padding: 48px;
          color: #8c8c8c;
        }
        
        .competence-tooltip {
          position: relative;
          cursor: help;
          border-bottom: 1px dashed #d9d9d9;
        }
        
        .updating-overlay {
          opacity: 0.5;
          pointer-events: none;
        }
        
        .block-code {
          font-size: 12px;
          color: #8c8c8c;
          margin-top: 4px;
        }
        
        @media (max-width: 768px) {
          .matrix-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .matrix-filter {
            width: 100%;
          }
        }
      `}</style>

      <div className="matrix-header">
        <span className="matrix-title">📊 Матрица компетенций</span>
        <input
          type="text"
          placeholder="🔍 Поиск дисциплин..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="matrix-filter"
        />
      </div>
      
      <div className="matrix-stats">
        Всего дисциплин: {filteredBlocks.length} из {disciplineBlocks.length} | 
        Всего компетенций: {competences.length}
      </div>

      <div className="matrix-table-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th style={{ minWidth: '250px' }}>Дисциплина / Компетенции</th>
              {competences.map(comp => (
                <th 
                  key={comp.id} 
                  className="competence-tooltip"
                  title={`${comp.code}: ${comp.description || comp.name}`}
                >
                  {comp.code}
                  <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#8c8c8c' }}>
                    {comp.name.length > 15 ? comp.name.slice(0, 15) + '...' : comp.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBlocks.length === 0 ? (
              <tr>
                <td colSpan={competences.length + 1} className="empty-state">
                  {filterText ? 'Дисциплины не найдены' : 'Нет добавленных дисциплин'}
                </td>
              </tr>
            ) : (
              filteredBlocks.map(block => {
                const isUpdating = updating === block.id
                return (
                  <tr key={block.id} className={isUpdating ? 'updating-overlay' : ''}>
                    <td className="discipline-cell">
                      <strong>{block.discipline?.name || `Дисциплина #${block.discipline_id}`}</strong>
                      {block.discipline?.short_name && (
                        <div className="block-code">{block.discipline.short_name}</div>
                      )}
                      <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
                        Семестр: {block.semester_number} | ЗЕТ: {block.credit_units}
                      </div>
                    </td>
                    {competences.map(comp => {
                      const isChecked = blockCompetences[block.id]?.includes(comp.id) || false
                      return (
                        <td key={comp.id} className="competence-cell">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCompetenceChange(
                                block.id,
                                comp.id,
                                e.target.checked
                              )}
                              disabled={readOnly || isUpdating}
                              className="checkbox-input"
                            />
                          </label>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}