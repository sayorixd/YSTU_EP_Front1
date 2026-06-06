export interface ReferenceConfig {
    name: string
    path: string
    displayName: string
}

const REFERENCES_CONFIG: ReferenceConfig[] = [
	{
		name: 'competence',
		path: '/competencies',
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
			},
		],
	},
	{
		name: 'competency-group',
		path: '/competency-groups',
		displayName: 'Группы компетенций',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'discipline',
		path: '/disciplines',
		displayName: 'Дисциплины',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{
				key: 'department_id',
				label: 'Кафедра',
				type: 'select',
				reference: 'department',
			},
		],
	},
	{
		name: 'direction',
		path: '/directions',
		displayName: 'Направления подготовки',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{
				key: 'educational_level_id',
				label: 'Уровень образования',
				type: 'select',
				reference: 'educational-level',
			},
			{
				key: 'educational_form_id',
				label: 'Форма обучения',
				type: 'select',
				reference: 'educational-form',
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
		fields: [{ key: 'name', label: 'Название' }],
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
		fields: [{ key: 'name', label: 'Название', type: 'text' }],
	},
	{
		name: 'educational-form',
		path: '/educational-forms',
		displayName: 'Формы обучения',
		fields: [{ key: 'name', label: 'Название', type: 'text' }],
	},
]