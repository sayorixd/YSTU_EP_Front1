'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Competence, Discipline, TableRow } from '@/app/types'
import { useCompetences } from '@/app/hooks/useCompetences'

import '@/styles/CompetenceMatrix.css'

type MatrixGroup = {
	key: string
	name: string
	blocks: Discipline[]
	blockIds: number[]
}

interface CompetenceMatrixProps {
	rows: TableRow[]
	readOnly?: boolean
	onCompetencesChange?: (blockId: number, competenceIds: number[]) => void
}

const normalize = (value: string) => value.toLowerCase().trim()

export const CompetenceMatrix: React.FC<CompetenceMatrixProps> = ({
	rows,
	readOnly = false,
	onCompetencesChange,
}) => {
	const { competences, getCompetencesForBlock, updateBlockCompetences } =
		useCompetences()

	const [groupCompetences, setGroupCompetences] = useState<
		Record<string, number[]>
	>({})
	const [loading, setLoading] = useState(true)
	const [filterText, setFilterText] = useState('')
	const [updating, setUpdating] = useState<string | null>(null)

	const matrixGroups: MatrixGroup[] = useMemo(() => {
		const map = new Map<string, MatrixGroup>()

		for (const row of rows) {
			for (const cell of row.data) {
				for (const discipline of cell) {
					const name = discipline.name?.trim()
					if (!name) continue

					const key = normalize(name)
					const existing = map.get(key)

					if (!existing) {
						map.set(key, {
							key,
							name,
							blocks: [discipline],
							blockIds: discipline.block_id != null ? [discipline.block_id] : [],
						})
					} else {
						existing.blocks.push(discipline)
						if (
							discipline.block_id != null &&
							!existing.blockIds.includes(discipline.block_id)
						) {
							existing.blockIds.push(discipline.block_id)
						}
					}
				}
			}
		}

		return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
	}, [rows])

	useEffect(() => {
		const loadAllCompetences = async () => {
			setLoading(true)

			try {
				const next: Record<string, number[]> = {}

				for (const group of matrixGroups) {
					const allCompetenceIds = await Promise.all(
						group.blockIds.map(blockId => getCompetencesForBlock(blockId))
					)

					next[group.key] = Array.from(new Set(allCompetenceIds.flat()))
				}

				setGroupCompetences(next)
			} finally {
				setLoading(false)
			}
		}

		if (matrixGroups.length > 0 && competences.length > 0) {
			void loadAllCompetences()
		} else {
			setGroupCompetences({})
			setLoading(false)
		}
	}, [matrixGroups, competences, getCompetencesForBlock])

	const handleCompetenceChange = async (
		groupKey: string,
		blockIds: number[],
		competenceId: number,
		checked: boolean
	) => {
		if (readOnly) return

		setUpdating(groupKey)

		try {
			const current = groupCompetences[groupKey] || []
			const newCompetenceIds = checked
				? Array.from(new Set([...current, competenceId]))
				: current.filter(id => id !== competenceId)

			setGroupCompetences(prev => ({
				...prev,
				[groupKey]: newCompetenceIds,
			}))

			if (onCompetencesChange) {
				for (const blockId of blockIds) {
					onCompetencesChange(blockId, newCompetenceIds)
				}
			}

			await Promise.all(
				blockIds.map(blockId =>
					updateBlockCompetences(blockId, newCompetenceIds)
				)
			)
		} finally {
			setUpdating(null)
		}
	}

	const filteredGroups = matrixGroups.filter(group =>
		group.name.toLowerCase().includes(filterText.toLowerCase())
	)

	if (loading) {
		return (
			<div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c' }}>
				Загрузка матрицы компетенций.
			</div>
		)
	}

	if (matrixGroups.length === 0) {
		return (
			<div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c' }}>
				Нет добавленных дисциплин в текущем учебном плане
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
			<div className="matrix-header">
				<span className="matrix-title">📊 Матрица компетенций</span>
				<input
					type="text"
					placeholder="🔍 Поиск дисциплин"
					value={filterText}
					onChange={e => setFilterText(e.target.value)}
					className="matrix-filter"
				/>
			</div>

			<div className="matrix-stats">
				Всего дисциплин: {filteredGroups.length} из {matrixGroups.length} |
				Всего компетенций: {competences.length}
			</div>

			<div className="matrix-table-container">
				<table className="matrix-table">
					<thead>
						<tr>
							<th className="matrix-table-title">Дисциплина / Компетенции</th>
							{competences.map(comp => (
								<th
									key={comp.id}
									className="competence-tooltip"
									title={`${comp.code}: ${comp.description || comp.name}`}
								>
									{comp.code}
									<div
										style={{
											fontSize: '11px',
											fontWeight: 'normal',
											color: '#8c8c8c',
										}}
									>
										{comp.name}
									</div>
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						{filteredGroups.length === 0 ? (
							<tr>
								<td colSpan={competences.length + 1} className="empty-state">
									{filterText ? 'Дисциплины не найдены' : 'Нет добавленных дисциплин'}
								</td>
							</tr>
						) : (
							filteredGroups.map(group => {
								const isUpdating = updating === group.key
								const checkedCompetences = groupCompetences[group.key] || []

								return (
									<tr key={group.key} className={isUpdating ? 'updating-overlay' : ''}>
										<td className="discipline-cell">
											<strong>{group.name}</strong>
											{group.blocks.length > 1 && (
												<div style={{ fontSize: '11px', color: '#8c8c8c' }}>
													Повторов в плане: {group.blocks.length}
												</div>
											)}
										</td>

										{competences.map(comp => {
											const isChecked = checkedCompetences.includes(comp.id)

											return (
												<td key={comp.id} className="competence-cell">
													<label className="checkbox-label">
														<input
															type="checkbox"
															checked={isChecked}
															onChange={e =>
																handleCompetenceChange(
																	group.key,
																	group.blockIds,
																	comp.id,
																	e.target.checked
																)
															}
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