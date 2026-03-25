export interface Discipline {
  block_id: number;
  table_id: number;
  id: number;
  name: string;
  credits: number;
  examType: string; // Будет хранить "Э", "З", "Д" и т.д.
  examTypeId: number | null; // Добавляем для хранения ID
  hasCourseWork: boolean;
  hasPracticalWork: boolean;
  department_name: string;
  department_id: number;
  department: string;
  competenceCodes: number[];
  lectureHours: number;
  labHours: number;
  practicalHours: number;
  semester?: number; // Добавлено
  core?: string; // Добавлено
  sourcePosition?: {
    rowIndex: number;
    colIndex: number;
  };
}

export interface TableRow {
  id?: number;
  name: string;
  color: string;
  data: Discipline[][];
}

export interface EducationalLevel {
  id: number;
  name: string;
}

export interface EducationalForm {
  id: number;
  name: string;
}

export interface DirectionData {
  id: number;
  name: string;
  level: string;
  form: string;
  semesters: number;
}

export interface InitialModalProps {
  handleInitialModalClose: (data: {
    directionData: DirectionData;
    mapData: any;
  }) => void;
  onClose: () => void;
  educationalLevels: EducationalLevel[];
  educationalForms: EducationalForm[];
}

