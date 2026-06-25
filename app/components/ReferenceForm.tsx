'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TemplateString } from '@/app/common/TemplateString'
import styles from '@/styles/ReferenceForm.module.css'

interface ReferenceItem {
	id: number
	name: string

	[key: string]: any
}

interface ReferenceField {
	key: string
	label: string
	type?: 'text' | 'select' | 'checkbox'
	reference?: string
}


interface Context {
	[key: string]: (context: any, referenceContext: any) => any
}

interface ContextField {
	key: string
	defaultValueKey: string
}

interface ReferenceConfig {
	context?: Context
	name: string
	path: string
	pathGetAll?: string
	displayName: string
	listField?: string
	titleField?: string
	fields: ReferenceField[]
	contextFields?: ContextField[]
}

const REFERENCES_CONFIG: ReferenceConfig[] = [
	{
		context: {
			"directionId": (context, referenceContext) => { return context.currentDirectionId; }
		},
		name: 'competence',
		path: "/competencies",
		pathGetAll: '/direction/{{directionId}}',
		displayName: 'Компетенции',
		listField: 'code',
		titleField: 'code',
		fields: [
			{ key: 'code', label: 'Код компетенции' },
			{ key: 'name', label: 'Название' },
			{ key: 'description', label: 'Описание' },
			{
				key: 'competency_group_id',
				label: 'Группа компетенций',
				type: 'select',
				reference: 'competency-group',
			}
		],
		contextFields: [
			{
				key: 'direction_id',
				defaultValueKey: "directionId"
			}
		]
	},
	{
		name: 'competency-group',
		path: '/competency-groups',
		displayName: 'Группы компетенций',
		fields: [
			{ key: 'name', label: 'Полное название' },
			{ key: 'short_name', label: 'Сокращённое название' },
		],
	},
	{
		name: 'discipline',
		path: '/disciplines',
		displayName: 'Дисциплины',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			// { key: 'short_name', label: 'Короткое название', type: 'text' },
			{
				key: 'department_id',
				label: 'Кафедра',
				type: 'select',
				reference: 'department', // Указываем, что поле ссылается на справочник department
			},
		],
	},
	{
		name: 'direction',
		path: '/directions',
		displayName: 'Направления подготовки',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{ key: 'code', label: 'Код', type: 'text' },
			{ key: 'profile', label: 'Профиль', type: 'text' },
			{
				key: 'educational_level_id',
				label: 'Уровень образования',
				type: 'select',
				reference: 'educational-level', // Новый справочник
			},
			{
				key: 'educational_form_id',
				label: 'Форма обучения',
				type: 'select',
				reference: 'educational-form', // Новый справочник
			},
			{ key: 'semester_count', label: 'Количество семестров', type: 'text' },
		],
	},
	{
		name: 'department',
		path: '/departments',
		displayName: 'Кафедры',
		fields: [
			{ key: 'name', label: 'Название' },
			{ key: 'short_name', label: 'Краткое название' },
			{ key: 'is_actual', label: 'Актуальна', type: 'checkbox' },
		],
	},
	{
		name: 'activity-type',
		path: '/activity-types',
		displayName: 'Виды занятий',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'control-type',
		path: '/control-types',
		displayName: 'Виды контроля',
		fields: [
			{ key: 'name', label: 'Название' },
			{ key: 'is_primary', label: 'Основной', type: 'checkbox' }
		],
	},
	{
		name: 'indicator',
		path: '/indicators',
		displayName: 'Индикаторы',
		listField: 'code',
		titleField: 'code',
		fields: [
			{ key: 'code', label: 'Код индикатора' },
			{ key: 'name', label: 'Название' },
			{
				key: 'competency_id',
				label: 'Компетенция',
				type: 'select',
				reference: 'competence',
			},
		],
	},
	{
		name: 'educational-level',
		path: '/educational-levels',
		displayName: 'Уровни образования',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{ key: 'name_in_genetive', label: 'Название в родительном падеже', type: 'text' },
		],
	},
	{
		name: 'educational-form',
		path: '/educational-forms',
		displayName: 'Формы обучения',
		fields: [{ key: 'name', label: 'Название', type: 'text' }],
	},
]

const normalize = (value: string) => value.toLowerCase().trim()
const getReferenceLabel = (item: ReferenceItem, referenceName?: string) => {
	if (referenceName === 'competence' || referenceName === 'indicator') {
		const code = item.code ?? ''
		const name = item.name ?? ''
		return `${code} / ${name}`.trim()
	}
	else if (referenceName === 'competency-group') {
		const name = item.name ?? ''
		const short_name = item.short_name ?? ''
		return `${name} (${short_name})`
	}
	return item.name ?? ''
}

export const ReferenceForm = ({ currentDirectionId, onClose }: { currentDirectionId: number, onClose: () => void }) => {
	const [context, setContext] = useState(
		{
			"currentDirectionId": currentDirectionId
		}
	);
	const referenceContext = useRef(null);
	const [selectedReference, setSelectedReference] =
		useState<ReferenceConfig | null>(null)
	const [items, setItems] = useState<ReferenceItem[]>([])
	const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null)
	const [formData, setFormData] = useState<Record<string, any>>({})
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')

	const [referenceData, setReferenceData] = useState<
		Record<string, ReferenceItem[]>
	>({})

	const calculateReferenceContext = (referenceConfig: ReferenceConfig) => {
		if (!referenceConfig.context) return null;

		let newReferenceContext: any = {};
		for (let key of Object.keys(referenceConfig.context as object))
		{
			newReferenceContext[key] = referenceConfig.context[key](context, newReferenceContext);
		}
		
		return newReferenceContext;
	}

	const fetchReferenceData = async (referenceName: string) => {
		const refConfig = REFERENCES_CONFIG.find(r => r.name === referenceName)
		if (!refConfig) return

		let path = refConfig.path;
		let context;
		if (refConfig.context)
		{
			context = calculateReferenceContext(refConfig);
			path = new TemplateString(refConfig.path).format(context)
			if (refConfig.pathGetAll)
			{
				path += new TemplateString(refConfig.pathGetAll).format(context);
			}
		}
		
		let url = `http://localhost:8001${path}/`;

		try {
			const response = await fetch(url)
			if (!response.ok)
				throw new Error(`Ошибка загрузки: ${response.statusText}`)
			const data = await response.json()
			setReferenceData(prev => ({
				...prev,
				[referenceName]: data,
			}))
		} catch (err) {
			console.error(`Error fetching ${referenceName}:`, err)
			setError(`Ошибка загрузки данных для ${refConfig.displayName}`)
		}
	}

	// Инициализация пустой формы
	const initializeEmptyForm = async () => {
		// Создаем новый элемент с пустыми значениями
		let newItemData =
			selectedReference?.fields.reduce((acc, field) => {
				acc[field.key] = field.type === 'checkbox' ? false : ''
				return acc
			}, {} as Record<string, any>) || {}
		
		if (selectedReference.context && selectedReference.contextFields)
		{
			console.log(selectedReference);
			console.log(referenceContext.current);
			for (let contextField of selectedReference.contextFields)
			{
				newItemData[contextField.key] = referenceContext.current[contextField.defaultValueKey];
			}
		}

		setSelectedItem(null)
		setFormData(newItemData)
	}

	const updateSelectedReferenceList = async () => {
		setIsLoading(true)
		setError(null)
		try {
			let path = selectedReference.path;
			
			if (selectedReference.context)
			{
				let context = calculateReferenceContext(selectedReference);
				referenceContext.current = context;
				
				path = new TemplateString(selectedReference.path).format(context)
				if (selectedReference.pathGetAll)
				{
					path += new TemplateString(selectedReference.pathGetAll).format(context);
				}
			}
			let url = `http://localhost:8001${path}/`;
				
			const response = await fetch(url)
			if (!response.ok)
				throw new Error(`Ошибка загрузки: ${response.statusText}`)
			const data = await response.json()

			setItems(data)
		} catch (err) {
			console.error(`Error fetching ${selectedReference.name}:`, err)
			setError(
				`Ошибка загрузки: ${err instanceof Error ? err.message : String(err)}`
			)
		} finally {
			setIsLoading(false)
		}

	}

	const updateSelectedReferenceListAndForm = async (selectedItemIndex: number = 0) => {
		setIsLoading(true)
		setError(null)
		try {
			let path = selectedReference.path;
			
			if (selectedReference.context)
			{
				let context = calculateReferenceContext(selectedReference);
				referenceContext.current = context;
				
				path = new TemplateString(selectedReference.path).format(context)
				if (selectedReference.pathGetAll)
				{
					path += new TemplateString(selectedReference.pathGetAll).format(context);
				}
			}
			let url = `http://localhost:8001${path}/`;
				
			const response = await fetch(url)
			if (!response.ok)
				throw new Error(`Ошибка загрузки: ${response.statusText}`)
			const data = await response.json()

			setItems(data)

			if (data.length > 0) {
				// Загружаем полные данные первого элемента
				const itemResponse = await fetch(
					`http://localhost:8001${selectedReference.path}/${data[selectedItemIndex].id}/`
				)
				if (!itemResponse.ok)
					throw new Error(
						`Ошибка загрузки элемента: ${itemResponse.statusText}`
					)
				const itemData = await itemResponse.json()

				setSelectedItem(itemData)
				setFormData(itemData)
			} else {
				// Для пустого справочника инициализируем пустую форму
				initializeEmptyForm();
			}
		} catch (err) {
			console.error(`Error fetching ${selectedReference.name}:`, err)
			setError(
				`Ошибка загрузки: ${err instanceof Error ? err.message : String(err)}`
			)
		} finally {
			setIsLoading(false)
		}
	}

	// Загрузка данных при выборе справочника
	useEffect(() => {
		if (!selectedReference) return

		selectedReference.fields.forEach(field => {
			if (field.type === 'select' && field.reference) {
				fetchReferenceData(field.reference)
			}
		})

		updateSelectedReferenceListAndForm()
	}, [selectedReference])

	// Обработчик выбора элемента или создания нового
	const handleItemClick = async (item: ReferenceItem | 'add') => {
		if (item === 'add') {
			initializeEmptyForm();
			return
		}

		setIsLoading(true)
		try {
			const response = await fetch(
				`http://localhost:8001${selectedReference!.path}/${item.id}/`
			)
			if (!response.ok) {
				const errorData = await response.json().catch(() => null)
				// Обработка 404 ошибки
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}
				throw new Error(
					errorData?.detail || `Ошибка загрузки: ${response.statusText}`
				)
			}
			const data = await response.json()

			setSelectedItem(data)
			setFormData(data)
		} catch (err) {
			console.error('Error loading item details:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	// const handleInputChange = (
	// 	e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	// 	field: string,
	// 	fieldType?: string
	// ) => {
	// 	setFormData({
	// 		...formData,
	// 		[field]: fieldType === 'checkbox' ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : e.target.value,
	// 	})
	// }
	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
		key: string,
		type?: 'text' | 'select' | 'checkbox'
	) => {
		const value =
			type === 'checkbox'
				? (e.target as HTMLInputElement).checked
				: e.target.value

		setFormData(prev => ({
			...prev,
			[key]: value,
		}))
	}
	const handleReferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const refName = e.target.value
		const ref = REFERENCES_CONFIG.find(r => r.name === refName)
		
		setSelectedReference(null)
		setItems([])
		setSelectedItem(null)
		setFormData({})
		setSearchTerm('')

		if (!currentDirectionId && ref.context?.directionId)
		{
			setError(`Для редактирования справочника \"${ref.displayName}\" откройте учебный план`)
			return;
		}

		setSelectedReference(ref)
	}

	const handleSave = async () => {
		if (!selectedReference) return

		const nameValue = formData.name?.trim()
		if (!nameValue) {
			setError('Поле "Название" обязательно для заполнения')
			return
		}

		const dataToSend = { ...formData }
		Object.keys(dataToSend).forEach(key => {
			if (typeof dataToSend[key] === 'string') {
				dataToSend[key] = dataToSend[key].trim()
			}
		})

		setIsLoading(true)
		setError(null)

		try {
			let response: Response
			const url = selectedItem
				? `http://localhost:8001${selectedReference.path}/${selectedItem.id}/`
				: `http://localhost:8001${selectedReference.path}/`

			response = await fetch(url, {
				method: selectedItem ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => null)

				// Обработка 404 ошибки (для GET, PATCH, DELETE)
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}

				// Обработка 409 ошибки (конфликт)
				if (response.status === 409) {
					throw new Error(errorData?.detail || 'Конфликт данных')
				}

				// Общая обработка ошибок
				if (errorData?.detail) {
					if (Array.isArray(errorData.detail)) {
						const messages = errorData.detail.map((e: any) => e.msg).join(', ')
						throw new Error(messages)
					} else {
						throw new Error(errorData.detail)
					}
				}

				throw new Error(`Ошибка ${response.status}: ${response.statusText}`)

				//old error handling:
				// throw new Error(
				// 	errorData?.detail ||
				// 		`Ошибка ${response.status}: ${response.statusText}`
				// )
			}

			const savedItem = await response.json()
			console.log('Сохранённый элемент:', savedItem)

			// Обновляем локальное состояние
			if (selectedItem) {
				setItems(
					items.map(item => (item.id === selectedItem.id ? savedItem : item))
				)
			} else {
				// После создания нового элемента обновляем список
				updateSelectedReferenceList();
			}

			setSelectedItem(savedItem)
			setFormData(savedItem)
			setSearchTerm('')
		} catch (err) {
			console.error('Error saving reference:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!selectedReference || !selectedItem) return

		if (!confirm(`Удалить выбранный элемент?`)) return

		setIsLoading(true)
		setError(null)
		try {
			const response = await fetch(
				`http://localhost:8001${selectedReference.path}/${selectedItem.id}/`,
				{
					method: 'DELETE',
				}
			)

			if (!response.ok) {
				const errorData = await response.json().catch(() => null)
				// Обработка 404 ошибки
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}
				throw new Error(
					errorData?.detail || `Ошибка удаления: ${response.statusText}`
				)
			}

			// Обновляем список
			updateSelectedReferenceListAndForm()
		} catch (err) {
			console.error('Error deleting reference:', err)
			setError(
				`Ошибка удаления: ${err instanceof Error ? err.message : String(err)}`
			)
		} finally {
			setIsLoading(false)
		}
	}

	const filteredItems = items.filter(item =>
		normalize(getReferenceLabel(item, selectedReference?.name)).includes(
			normalize(searchTerm)
		)
	)

	return (
		<>
			<div className={styles['reference-form-backdrop']} onClick={onClose} />

			<div className={styles['reference-form']}>
				<div className={styles['form-header']}>
					<h3>Редактирование справочников</h3>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div
							className={`${styles['loading-spinner']} ${
								isLoading ? styles['active'] : ''
							}`}
						/>
						<button onClick={onClose} className={styles['close-button']}>
							×
						</button>
					</div>
				</div>

				{error && <div className={styles['error-message']}>{error}</div>}

				<div className={styles['form-group']}>
					<label>Справочник:</label>
					<select
						value={selectedReference?.name || ''}
						onChange={handleReferenceChange}
						disabled={isLoading}
					>
						<option value=''>Выберите справочник</option>
						{REFERENCES_CONFIG.map(ref => (
							<option key={ref.name} value={ref.name}>
								{ref.displayName}
							</option>
						))}
					</select>
				</div>

				{selectedReference && (
					<div className={styles['form-content']}>
						<div className={styles['items-container']}>
							<div className={styles['search-container']}>
								<input
									type='text'
									placeholder='Поиск по названию...'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className={styles['search-input']}
								/>
							</div>
							<div className={styles['items-list']}>
								<div
									className={`${styles['item']} ${styles['add-item']} ${
										!selectedItem ? styles['selected'] : ''
									}`}
									onClick={() => handleItemClick('add')}
								></div>
								{filteredItems.map(item => (
									<div
										key={item.id}
										className={`${styles['item']} ${
											selectedItem?.id === item.id ? styles['selected'] : ''
										}`}
										onClick={() => handleItemClick(item)}
										title={getReferenceLabel(item, selectedReference?.name)}
									>
										{getReferenceLabel(item, selectedReference?.name)}
									</div>
								))}
							</div>
						</div>

						<div className={styles['fields-container']}>
							<h4>
								{selectedItem
									? getReferenceLabel(selectedItem, selectedReference?.name)
									: 'Новый элемент'}
							</h4>

							{selectedReference.fields.map(field => (
								<div key={field.key} className={styles['field-group']}>
									<label>{field.label}:</label>
									{field.type === 'select' && field.reference ? (
										<div className={styles['form-group']}>
											<select
												value={formData[field.key] || ''}
												onChange={e => handleInputChange(e, field.key)}
												disabled={isLoading}
											>
												<option value=''>Выберите...</option>
												{referenceData[field.reference]?.map(item => (
													<option key={item.id} value={item.id}>
														{getReferenceLabel(item, field.reference)}
													</option>
												))}
											</select>
										</div>
									) : field.type === 'checkbox' ? (
										<div className={styles['form-group']}>
											<input
												type='checkbox'
												checked={!!formData[field.key]}
												onChange={e => handleInputChange(e, field.key, 'checkbox')}
												disabled={isLoading}
											/>
										</div>
									) : (
										<input
											type='text'
											value={formData[field.key] || ''}
											onChange={e => handleInputChange(e, field.key)}
											disabled={isLoading}
										/>
									)}
								</div>
							))}

							<div className={styles['form-actions']}>
								<button
									onClick={handleSave}
									className={styles['save-button']}
									disabled={isLoading}
								>
									{isLoading ? 'Сохранение...' : 'Сохранить'}
								</button>
								{selectedItem && (
									<button
										onClick={handleDelete}
										className={styles['delete-button']}
										disabled={isLoading}
									>
										{isLoading ? 'Удаление...' : 'Удалить'}
									</button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
