// app/components/CalendarPlanGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  WEEK_AUTUMN,
  WEEK_SPRING,
  WEEK_SUMMER, // <--- Добавили
  WEEK_COUNT,
  MAX_COURSES,
  generateWeekDateRanges,
  getAcademicStartDate,
  getCourseEndDate,
  calculateAcademicData
} from '../common/CalendarPlanCommon';
import { exportCalendarPlan } from '../hooks/exportCalendarPlan';
import '../../styles/CalendarPlan.css';

type Course = {
  course: number;
  start_date: string;
  end_date: string;
  weeks: string[];
};

type PlanData = {
  title: string;
  academic_year: string;
  group: string;
  profile: string;
  reg_number: string;
  start_date: string;
  end_date: string;
  courses: Course[];
};

type Props = {
  plan: any;
  onSave: (data: PlanData) => void;
};

const ALLOWED_WEEK_CODES = new Set(['', 'С', 'У', 'П', 'Д', 'Г', '=', 'Н']);
const isAllowedWeekCode = (code: string) => ALLOWED_WEEK_CODES.has(String(code).toUpperCase());

function normalizePlanData(raw: any): PlanData {
  if (raw && Array.isArray(raw.courses)) {
    return {
      title: raw.title ?? '',
      academic_year: raw.academic_year ?? '',
      group: raw.group ?? '',
      profile: raw.profile ?? '',
      reg_number: raw.reg_number ?? '',
      start_date: raw.start_date ?? '',
      end_date: raw.end_date ?? '',
      courses: raw.courses.map((c: any, i: number) => ({
        course: c.course ?? i + 1,
        start_date: c.start_date ?? '',
        end_date: c.end_date ?? '',
        weeks: Array.isArray(c.weeks) ? c.weeks : Array(WEEK_COUNT).fill(''),
      })),
    };
  }
  return {
    title: '', academic_year: '', group: '', profile: '', reg_number: '',
    start_date: '', end_date: '',
    courses: [{ course: 1, start_date: '', end_date: '', weeks: Array(WEEK_COUNT).fill('') }],
  };
}

const count = (weeks: string[], codes: string[]) => weeks.filter((w) => codes.includes(w)).length;

const validateDates = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

const getDateErrorMessage = (startDate: string, endDate: string): string | null => {
  if (!startDate || !endDate) return null;
  if (new Date(startDate) > new Date(endDate)) {
    return 'Ошибка: Дата окончания обучения не может быть раньше даты начала!';
  }
  return null;
};

export function CalendarPlanGrid({ plan, onSave }: Props) {
  const [data, setData] = useState<PlanData>(normalizePlanData(plan?.data));
  const [startDate, setStartDate] = useState(data.start_date || '');
  const [endDate, setEndDate] = useState(data.end_date || '');
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const { courseCount } = calculateAcademicData(startDate, endDate);
    const startYear = new Date(startDate).getFullYear();

    const updatedCourses = Array.from({ length: courseCount }, (_, i) => {
      const existing = data.courses[i];
      const courseStart = getAcademicStartDate(startYear + i);
      const courseEnd = getCourseEndDate(startYear + i + 1);
      return {
        course: i + 1,
        start_date: existing?.start_date || courseStart,
        end_date: existing?.end_date || courseEnd,
        weeks: existing?.weeks ?? Array(WEEK_COUNT).fill(''),
      };
    });

    const hasChanges = updatedCourses.some((c, i) =>
      c.start_date !== data.courses[i].start_date || c.end_date !== data.courses[i].end_date
    );
    if (hasChanges) {
      setData(prev => ({ ...prev, courses: updatedCourses }));
    }
  }, [startDate, endDate]);

  const firstCourseStart = data.courses[0]?.start_date || startDate;
  const weekDateRanges = generateWeekDateRanges(firstCourseStart);
  const courses = data.courses;

  const updateWeek = (ci: number, wi: number, v: string) => {
    if (v == " ")
    {
      v = "";
    }

    const next = courses.map((c, i) =>
      i === ci ? { ...c, weeks: c.weeks.map((w, j) => (j === wi ? v : w)) } : c
    );
    setData({ ...data, courses: next });
  };

  const handleSave = () => {
    if (!validateDates(startDate, endDate)) {
      alert(getDateErrorMessage(startDate, endDate));
      return;
    }
    if (!(data.title && data.academic_year && data.group && data.profile && data.reg_number && startDate && endDate)) {
      alert('Заполните все обязательные поля в шапке');
      return;
    }
    onSave({ ...data, start_date: startDate, end_date: endDate });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newStartDate = e.target.value;
    if (newStartDate) {
      const date = new Date(newStartDate);
      const year = date.getFullYear();
      const academicStart = getAcademicStartDate(year);
      if (new Date(newStartDate) < new Date(academicStart)) {
        newStartDate = academicStart;
      }
    }
    setStartDate(newStartDate);
    setData({ ...data, start_date: newStartDate });

    if (endDate && !validateDates(newStartDate, endDate)) {
      setDateError(getDateErrorMessage(newStartDate, endDate));
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    setData({ ...data, end_date: newEndDate });

    if (startDate && !validateDates(startDate, newEndDate)) {
      setDateError(getDateErrorMessage(startDate, newEndDate));
    } else {
      setDateError(null);
    }
  };

const onCellFocus = (e: React.ChangeEvent<HTMLInputElement>) => {
  let input_element = e.currentTarget;
  setTimeout(function() { 
    let length = 0;
    if (input_element.value)
    {
      length = input_element.value.length;
    }
    input_element.selectionStart = 0;
    input_element.selectionEnd = length;
  }, 0);
}

const onCellKeyPress = (e: React.ChangeEvent<HTMLInputElement>, ci: number, wi: number) => {
  e = e || window.event;

  let d_ci = 0;
  let d_wi = 0;
  
  if (e.keyCode == 37 && e.ctrlKey)  // Ctrl + Left
  {
    d_wi = Math.max(-10, -wi);
  }
  else if (e.keyCode == 38 && e.ctrlKey)  // Ctrl + Up
  {
    d_ci = -ci;
  }
  else if (e.keyCode == 39 && e.ctrlKey)  // Ctrl + Right
  {
    d_wi = Math.min(10, WEEK_COUNT - 1 - wi);
  }
  else if (e.keyCode == 40 && e.ctrlKey)  // Ctrl + Down
  {
    d_ci = courses.length - 1 - ci;
  }
  else if (e.keyCode == 37)  // <- Left arrow key
  {
    d_wi = Math.max(-1, -wi);
  }
  else if (e.keyCode == 38)  // ^ Up arrow key
  {
    d_ci = Math.max(-1, -ci);
  }
  else if (e.keyCode == 39)  // -> Right arrow key
  {
    d_wi = Math.min(1, WEEK_COUNT - 1 - wi);
  }
  else if (e.keyCode == 40)  // \/ Down arrow key
  {
    d_ci = Math.min(1, courses.length - 1 - ci);
  }
  else if (e.keyCode == 36 && e.ctrlKey)  // Ctrl + HOME
  {
    d_ci = -ci;
    d_wi = -wi;
  }
  else if (e.keyCode == 35 && e.ctrlKey)  // Ctrl + END
  {
    d_ci = courses.length - 1 - ci;
    d_wi = WEEK_COUNT - 1 - wi;
  }
  else if (e.keyCode == 36)  // HOME key
  {
    d_wi = -wi;
  }
  else if (e.keyCode == 35)  // END key
  {
    d_wi = WEEK_COUNT - 1 - wi;
  }
  else
  {
    return;
  }

  const mod = (x, y) => { return ((x % y) + y) % y; };

  let new_ci = mod(ci + d_ci, courses.length);
  let new_wi = mod(wi + d_wi, WEEK_COUNT);

  const cell_move_to = document.getElementById(`calendar-plan-cell-course-${new_ci}-week-${new_wi}`);
  cell_move_to.focus();
}

  return (
    <div className="calendar-plan">
      <h3>Календарный учебный график</h3>
      
      {/* ШАПКА */}
      <div className="calendar-plan__header">
        <label>Название: <input placeholder="Название" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} /></label>
        <label>Учебный год: <input placeholder="Учебный год" value={data.academic_year} onChange={(e) => setData({ ...data, academic_year: e.target.value })} /></label>
        <label>Группа: <input placeholder="Группа" value={data.group} onChange={(e) => setData({ ...data, group: e.target.value })} /></label>
        <label>Профиль: <input placeholder="Профиль" value={data.profile} onChange={(e) => setData({ ...data, profile: e.target.value })} /></label>
        <label>Рег. номер: <input placeholder="Рег. номер" value={data.reg_number} onChange={(e) => setData({ ...data, reg_number: e.target.value })} /></label>
        <label>
          Дата начала обучения (общая):
          <input type="date" value={startDate} onChange={handleStartDateChange} />
        </label>
        <label>
          Дата окончания обучения (общая):
          <input type="date" value={endDate} onChange={handleEndDateChange} />
        </label>
        {dateError && (
          <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px', gridColumn: 'span 2' }}>
            ⚠️ {dateError}
          </div>
        )}
        <label style={{ gridColumn: 'span 2' }}>
          Количество курсов (рассчитано автоматически): {courses.length}
        </label>

        <details>
          <summary>Инструкции по управлению</summary>
          <ul>
            <li>Левая кнопка мыши по ячейке &ndash; редактировать ячейку</li>
            <li>С, У, П, Д, Н, Г, =, Пробел и Backspace &ndash; ввод значения в ячейку</li>
            <li>Стрелки (←, ↑, →, ↓) &ndash; переместиться влево, вверх, вправо, вниз</li>
            <li>Ctrl+Стрелки (←, ↑, →, ↓) &ndash; переместиться на 10 ячеек влево, вверх, вправо, вниз</li>
            <li>Home / End &ndash; переместиться в начало/конец строки</li>
            <li>Ctrl+Home / Ctrl+End &ndash; переместиться в начальную/конечную ячейку таблицы</li>
          </ul>
        </details>
      </div>

      {/* ТАБЛИЦА */}
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table className="calendar-plan__table" style={{ minWidth: '1400px' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ minWidth: '140px' }}>Курс</th><th colSpan={WEEK_AUTUMN}>Осенний семестр</th><th colSpan={WEEK_SPRING}>Весенний семестр</th><th colSpan={WEEK_SUMMER}>Летний период</th><th colSpan={3}>Теория</th><th rowSpan={2}>Экз.</th><th rowSpan={2}>Уч.</th><th rowSpan={2}>Друг.</th><th rowSpan={2}>Предд.</th><th rowSpan={2}>НИР</th><th rowSpan={2}>ГИА</th><th rowSpan={2}>Каник.</th><th rowSpan={2}>Всего</th>
            </tr>
            <tr>
              {Array.from({ length: WEEK_COUNT }, (_, i) => (
                <th key={i} title={weekDateRanges[i]} style={{ padding: '5px', writingMode: 'sideways-lr', textOrientation: 'mixed' }}>
                  <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.1', letterSpacing: '0.5px', fontSize: '11px' }}>
                    {weekDateRanges[i]}
                  </div>
                </th>
              ))}
              <th>О</th><th>В</th><th>Σ</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, ci) => {
              const autumn = c.weeks.slice(0, WEEK_AUTUMN);
              const spring = c.weeks.slice(WEEK_AUTUMN, WEEK_AUTUMN + WEEK_SPRING); 
              
              const theoryO = count(autumn, ['', 'С']);
              const theoryV = count(spring, ['', 'С']);
              
              const exams = count(c.weeks, ['С']);
              const study = count(c.weeks, ['У']);
              const other = count(c.weeks, ['П']);
              const pre = count(c.weeks, ['Д']);
              const nir = count(c.weeks, ['Н']);
              const gia = count(c.weeks, ['Г']);
              const holidays = count(c.weeks, ['=']);
              const total = theoryO + theoryV + exams + study + other + pre + nir + gia + holidays;

              return (
                <tr key={c.course}>
                  <td style={{ verticalAlign: 'middle', padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Курс {c.course}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', whiteSpace: 'normal' }}>
                      {c.start_date} –<br />{c.end_date}
                    </div>
                  </td>
                  {c.weeks.map((w, wi) => {
                    const isInvalidWeek = w && !isAllowedWeekCode(w);
                    const cell_id = `calendar-plan-cell-course-${ci}-week-${wi}`;
                    return (
                      <td key={wi}>
                        <input
                          id={cell_id}
                          className={`calendar-plan__week-input${
                            isInvalidWeek ? ' calendar-plan__week-input_invalid' : ''
                          }`}
                          value={w}
                          maxLength={1}
                          onChange={(e) =>
                            updateWeek(ci, wi, e.target.value.toUpperCase())
                          }
                          onFocus={(e) => { onCellFocus(e); }}
                          onKeyDown={(e) => { onCellKeyPress(e, ci, wi); }}
                          className={`calendar-plan__week-input${isInvalidWeek ? ' calendar-plan__week-input_invalid' : ''}`}
                          value={w}
                          maxLength={1}
                          style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed' }}
                          onChange={(e) => updateWeek(ci, wi, e.target.value.toUpperCase())}
                        />
                      </td>
                    );
                  })}
                  <td className="calendar-plan__summary">{theoryO}</td>
                  <td className="calendar-plan__summary">{theoryV}</td>
                  <td className="calendar-plan__summary">{theoryO + theoryV}</td>
                  <td>{exams}</td>
                  <td>{study}</td>
                  <td>{other}</td>
                  <td>{pre}</td>
                  <td>{nir}</td>
                  <td>{gia}</td>
                  <td>{holidays}</td>
                  <td className="calendar-plan__summary">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ЛЕГЕНДА и КНОПКИ */}
      <div className="calendar-plan__legend">
        <div>С — теоретическое обучение (вкл. сессию) | У — учебная практика | П — другие практики | Д — преддипломная практика</div>
        <div>Н — НИР | Г — ГИА | = — каникулы | (пусто) — теоретическое обучение</div>
      </div>
      <div className="calendar-plan__actions">
        <button onClick={handleSave} style={dateError ? { opacity: 0.5, cursor: 'not-allowed' } : {}} disabled={!!dateError}>
          Сохранить календарный план
        </button>
        <button
          onClick={() => !dateError && exportCalendarPlan({ data: { ...data, start_date: startDate, end_date: endDate } })}
          style={dateError ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          disabled={!!dateError}
          title={dateError || "Экспорт в Excel"}
        >
          Экспорт в Excel
        </button>
      </div>
    </div>
  );
}