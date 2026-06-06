'use client'

import React, { useState, useEffect } from 'react'
import styles from '@/styles/CompetenciesSetting.module.css'

interface Competence {
	id: number
	code: string
	name: string
	competency_group_id: number
}

interface CompetenceGroup {
	id: number
	name: string
}

interface CompetenciesSettingProps {
	initialCompetenceIds: number[] // Теперь принимаем массив ID
	onSave: (competenceIds: number[]) => void // Возвращаем массив ID
	onClose: () => void
}

export const CompetenciesSetting = ({
	initialCompetenceIds,
	onSave,
	onClose,
}: CompetenciesSettingProps) => {
	const [allCompetencies, setAllCompetencies] = useState<Competence[]>([])
	const [competenceGroups, setCompetenceGroups] = useState<CompetenceGroup[]>(
		[]
	)
	const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
	const [selectedCompetenceIds, setSelectedCompetenceIds] =
		useState<number[]>(initialCompetenceIds)
	const [currentCompetence, setCurrentCompetence] = useState<Competence | null>(
		null
	)
	const [currentGroupName, setCurrentGroupName] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			try {
				// Загрузка групп компетенций
				const groupsResponse = await fetch(
					'http://localhost:8001/competency-groups/'
				)
				if (!groupsResponse.ok)
					throw new Error('Ошибка загрузки групп компетенций')
				const groupsData = await groupsResponse.json()
				setCompetenceGroups(groupsData)

				// Загрузка всех компетенций
				const compResponse = await fetch('http://localhost:8001/competencies/')
				if (!compResponse.ok) throw new Error('Ошибка загрузки компетенций')
				const compData = await compResponse.json()
				setAllCompetencies(compData)
			} catch (err) {
				console.error('Error loading data:', err)
				setError(
					`Ошибка загрузки данных: ${
						err instanceof Error ? err.message : String(err)
					}`
				)
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	// Загрузка названия группы для текущей компетенции
	useEffect(() => {
		if (!currentCompetence) return

		const fetchGroupName = async () => {
			try {
				const response = await fetch(
					`http://localhost:8001/competency-groups/${currentCompetence.competency_group_id}/`
				)
				if (!response.ok) throw new Error('Ошибка загрузки группы')
				const groupData = await response.json()
				setCurrentGroupName(groupData.name)
			} catch (err) {
				console.error('Error loading group:', err)
				setCurrentGroupName('Неизвестная группа')
			}
		}

		fetchGroupName()
	}, [currentCompetence])

	// Получаем полные объекты выбранных компетенций по их ID
	const selectedCompetences = allCompetencies.filter(comp =>
		selectedCompetenceIds.includes(comp.id)
	)

	const normalize = (value: string) => value.toLowerCase().trim()
	const formatCompetence = (comp: Competence) => `${comp.code} / ${comp.name}`
	const filteredCompetencies = allCompetencies.filter(comp => {
		const matchesGroup = selectedGroup
			? comp.competency_group_id === selectedGroup
			: true

		const query = normalize(searchTerm)
		const combined = normalize(formatCompetence(comp))

		return matchesGroup && combined.includes(query)
	})

	const isSelected = (competenceId: number) => {
		return selectedCompetenceIds.includes(competenceId)
	}

	const handleCompetenceClick = (
		competence: Competence,
		event: React.MouseEvent
	) => {
		if (event.detail === 2) {
			// Двойной клик
			toggleCompetence(competence.id)
		} else {
			// Одинарный клик
			setCurrentCompetence(competence)
		}
	}

	const toggleCompetence = (competenceId: number) => {
		setSelectedCompetenceIds(prev =>
			isSelected(competenceId)
				? prev.filter(id => id !== competenceId)
				: [...prev, competenceId]
		)
	}

	const groupedSelectedCompetencies = competenceGroups
		.map(group => ({
			group,
			competencies: selectedCompetences.filter(
				c => c.competency_group_id === group.id
			),
		}))
		.filter(g => g.competencies.length > 0)

	const handleSave = () => {
		if (selectedCompetenceIds.length === 0) {
			setError('Необходимо выбрать хотя бы одну компетенцию')
			return
		}
		onSave(selectedCompetenceIds)
		onClose()
	}

	return (
		<>
			<div className={styles.modalBackdrop} onClick={onClose} />

			<div className={styles.modal}>
				<div className={styles.modalHeader}>
					<h3>Настройка компетенций</h3>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div
							className={`${styles.loadingSpinner} ${
								isLoading ? styles.active : ''
							}`}
						/>
						<button onClick={onClose} className={styles.closeButton}>
							×
						</button>
					</div>
				</div>

				{error && <div className={styles.errorMessage}>{error}</div>}

				<div className={styles.contentContainer}>
					{/* Левая панель - все компетенции */}
					<div className={styles.competenciesColumn}>
						<div className={styles.searchContainer}>
							<select
								className={styles.groupSelect}
								value={selectedGroup || ''}
								onChange={e =>
									setSelectedGroup(
										e.target.value ? Number(e.target.value) : null
									)
								}
								disabled={isLoading}
							>
								<option value=''>Все группы компетенций</option>
								{competenceGroups.map(group => (
									<option key={group.id} value={group.id}>
										{group.name}
									</option>
								))}
							</select>
							<input
								type='text'
								placeholder='Поиск по коду или названию...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className={styles.searchInput}
								disabled={isLoading}
							/>
						</div>
						<div className={styles.itemsList}>
							{filteredCompetencies.map(comp => (
								<div
									key={comp.id}
									className={`${styles.competenceItem} ${
										isSelected(comp.id) ? styles.selected : ''
									}`}
									onClick={e => handleCompetenceClick(comp, e)}
									title={formatCompetence(comp)}
								>
									<div>
										<p className={styles.competenceCode}>{comp.code}</p>
										<p className={styles.competenceName}>{comp.name}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Центральная панель - выбранные компетенции */}
					<div className={styles.competenciesColumn}>
						<div className={styles.searchContainer}>
							<h4>Выбранные компетенции ({selectedCompetenceIds.length})</h4>
						</div>
						<div className={styles.itemsList}>
							{groupedSelectedCompetencies.length > 0 ? (
								groupedSelectedCompetencies.map(({ group, competencies }) => (
									<div key={group.id}>
										<div className={styles.groupHeader}>{group.name}</div>
										{competencies.map(comp => (
											<div
												key={comp.id}
												className={`${styles.competenceItem} ${styles.selected}`}
												onClick={e => handleCompetenceClick(comp, e)}
												title={`${comp.code}: ${comp.name}`}
											>
												<div>
													<p className={styles.competenceCode}>{comp.code}</p>
													<p className={styles.competenceName}>
														{comp.name.length > 22
															? comp.name.substring(0, 22) + '...'
															: comp.name}
													</p>
												</div>
											</div>
										))}
									</div>
								))
							) : (
								<div className={styles.emptyState}>
									Выберите компетенции из списка слева
								</div>
							)}
						</div>
					</div>

					{/* Правая панель - описание */}
					<div className={styles.descriptionColumn}>
						<h4 className={styles.descriptionTitle}>
							Информация о компетенции
						</h4>
						<div className={styles.descriptionContent}>
							{currentCompetence ? (
								<>
									<p>
										<strong>Код компетенции:</strong> {currentCompetence.code}
									</p>
									<p>
										<strong>Группа компетенций:</strong> {currentGroupName}
									</p>
									<p className={styles.descriptionText}>
										<strong>Описание:</strong> {currentCompetence.description}
									</p>
								</>
							) : (
								<p className={styles.emptyState}>
									Выберите компетенцию для просмотра информации
								</p>
							)}
						</div>

						<div className={styles.actionsContainer}>
							<button
								onClick={handleSave}
								className={`${styles.actionButton} ${styles.saveButton}`}
								disabled={isLoading}
							>
								{isLoading ? 'Сохранение...' : 'Сохранить'}
							</button>
							<button
								onClick={onClose}
								className={`${styles.actionButton} ${styles.cancelButton}`}
								disabled={isLoading}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
