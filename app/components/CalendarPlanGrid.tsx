'use client';
import { useState } from 'react';
import { WEEK_AUTUMN, WEEK_SPRING, WEEK_COUNT, MAX_COURSES, generateWeekDateRanges } from '../common/CalendarPlanCommon';
import { exportCalendarPlan } from '../hooks/exportCalendarPlan';
import '../../styles/CalendarPlan.css';

type Course = {
  course: number;
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
  semesters: number;
};

const ALLOWED_WEEK_CODES = new Set(['', 'С', 'У', 'П', 'Д', 'Г', '=', 'Н']);
const isAllowedWeekCode = (code: string) =>
  ALLOWED_WEEK_CODES.has(String(code).toUpperCase());

function normalizePlanData(raw: any, semesters: number): PlanData {
  const defaultCoursesCount = Math.ceil(semesters / 2);
  
  if (raw && Array.isArray(raw.courses) && raw.courses.length > 0) {
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
        weeks: Array.isArray(c.weeks)
          ? c.weeks
          : Array(WEEK_COUNT).fill(''),
      })),
    };
  }
  return {
    title: '',
    academic_year: '',
    group: '',
    profile: '',
    reg_number: '',
    start_date: '',
    end_date: '',
    courses: Array.from({ length: defaultCoursesCount }, (_, i) => ({
      course: i + 1,
      weeks: Array(WEEK_COUNT).fill('')
    })),
  };
}

const count = (weeks: string[], codes: string[]) =>
  weeks.filter((w) => codes.includes(w)).length;

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

export function CalendarPlanGrid({ plan, onSave, semesters }: Props) {
  const [data, setData] = useState<PlanData>(() => {
    const normalized = normalizePlanData(plan?.data, semesters);
    if (!normalized.start_date) {
      const year = normalized.academic_year || new Date().getFullYear();
      normalized.start_date = `${year}-09-01`;
    }
    if (!normalized.end_date) {
      const year = normalized.academic_year || new Date().getFullYear();
      const nextYear = parseInt(String(year), 10) + 1;
      normalized.end_date = `${nextYear}-08-31`;
    }
    return normalized;
  });

  const [startDate, setStartDate] = useState(data.start_date);
  const [endDate, setEndDate] = useState(data.end_date);
  const [dateError, setDateError] = useState<string | null>(null);

  const weekDateRanges = generateWeekDateRanges(startDate, endDate);
  const courses = Array.isArray(data.courses) ? data.courses : [];

  const setCoursesCount = (n: number) => {
    const next: Course[] = [];
    for (let i = 1; i <= n; i++) {
      next.push({
        course: i,
        weeks: courses[i - 1]?.weeks ?? Array(WEEK_COUNT).fill(''),
      });
    }
    setData({ ...data, courses: next });
  };

  const updateWeek = (ci: number, wi: number, v: string) => {
    if (v == " ") { v = ""; }
    const next = courses.map((c, i) =>
      i === ci
        ? { ...c, weeks: c.weeks.map((w, j) => (j === wi ? v : w)) }
        : c
    );
    setData({ ...data, courses: next });
  };

  const handleSave = () => {
    if (!validateDates(startDate, endDate)) {
      alert(getDateErrorMessage(startDate, endDate));
      return;
    }
    
    const dataToSave = {
      ...data,
      start_date: startDate,
      end_date: endDate,
    };

    if (!(dataToSave.title &&
      dataToSave.academic_year &&
      dataToSave.group &&
      dataToSave.profile &&
      dataToSave.reg_number &&
      dataToSave.start_date &&
      dataToSave.end_date))
    {
      alert('Заполните все обязательные поля');
      return;
    }
    onSave(dataToSave);
  };

  const totals = (() => {
    let tAutumn = 0, tSpring = 0, tTotal = 0, exams = 0, study = 0, other = 0, pre = 0, nir = 0, gia = 0, holidays = 0, total = 0;
    data.courses.forEach((course) => {
      const weeks = course.weeks ?? Array(WEEK_COUNT).fill('');
      const autumn = weeks.slice(0, 23);
      const spring = weeks.slice(23);
      const isTheory = (w: string) => w === '' || w === 'С';
      const countWeeks = (v: string) => weeks.filter((w) => w === v).length;
      const a = autumn.filter(isTheory).length;
      const s = spring.filter(isTheory).length;
      const th = a + s;
      tAutumn += a; tSpring += s; tTotal += th;
      exams += countWeeks('С'); study += countWeeks('У'); other += countWeeks('П');
      pre += countWeeks('Д'); nir += countWeeks('Н'); gia += countWeeks('Г');
      holidays += countWeeks('='); total += th + study + other + pre + nir + gia + holidays;
    });
    return { tAutumn, tSpring, tTotal, exams, study, other, pre, nir, gia, holidays, total };
  })();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    setData({...data, start_date: newStartDate});
    if (endDate && !validateDates(newStartDate, endDate)) {
      setDateError(getDateErrorMessage(newStartDate, endDate));
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    setData({...data, end_date: newEndDate});
    if (startDate && !validateDates(startDate, newEndDate)) {
      setDateError(getDateErrorMessage(startDate, newEndDate));
    } else {
      setDateError(null);
    }
  };

  const onCellFocus = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input_element = e.currentTarget;
    setTimeout(function() {
      let length = input_element.value ? input_element.value.length : 0;
      input_element.selectionStart = 0;
      input_element.selectionEnd = length;
    }, 0);
  };

  const onCellKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, ci: number, wi: number) => {
    let d_ci = 0, d_wi = 0;
    if (e.keyCode == 37 && e.ctrlKey) d_wi = Math.max(-10, -wi);
    else if (e.keyCode == 38 && e.ctrlKey) d_ci = -ci;
    else if (e.keyCode == 39 && e.ctrlKey) d_wi = Math.min(10, WEEK_COUNT - 1 - wi);
    else if (e.keyCode == 40 && e.ctrlKey) d_ci = courses.length - 1 - ci;
    else if (e.keyCode == 37) d_wi = Math.max(-1, -wi);
    else if (e.keyCode == 38) d_ci = Math.max(-1, -ci);
    else if (e.keyCode == 39) d_wi = Math.min(1, WEEK_COUNT - 1 - wi);
    else if (e.keyCode == 40) d_ci = Math.min(1, courses.length - 1 - ci);
    else if (e.keyCode == 36 && e.ctrlKey) { d_ci = -ci; d_wi = -wi; }
    else if (e.keyCode == 35 && e.ctrlKey) { d_ci = courses.length - 1 - ci; d_wi = WEEK_COUNT - 1 - wi; }
    else if (e.keyCode == 36) d_wi = -wi;
    else if (e.keyCode == 35) d_wi = WEEK_COUNT - 1 - wi;
    else return;

    const mod = (x: number, y: number) => { return ((x % y) + y) % y; };
    let new_ci = mod(ci + d_ci, courses.length);
    let new_wi = mod(wi + d_wi, WEEK_COUNT);
    const cell_move_to = document.getElementById(`calendar-plan-cell-course-${new_ci}-week-${new_wi}`);
    cell_move_to?.focus();
  };

  return (
    <div className="calendar-plan">
      <h3>Календарный учебный график</h3>
      <div className="calendar-plan__header">
        <label>Название:<input placeholder="Название" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} /></label>
        <label>Учебный год:<input placeholder="Учебный год" value={data.academic_year} onChange={(e) => { setData({ ...data, academic_year: e.target.value }); if (e.target.value) { setStartDate(`${e.target.value}-09-01`); } }} /></label>
        <label>Группа:<input placeholder="Группа" value={data.group} onChange={(e) => setData({ ...data, group: e.target.value })} /></label>
        <label>Профиль:<input placeholder="Профиль" value={data.profile} onChange={(e) => setData({ ...data, profile: e.target.value })} /></label>
        <label>Рег. номер:<input placeholder="Рег. номер" value={data.reg_number} onChange={(e) => setData({ ...data, reg_number: e.target.value })} /></label>
        <label>Дата начала обучения:<input type="date" value={startDate} onChange={handleStartDateChange} /><small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '12px' }}>(Если выходной день - начнётся с ближайшего понедельника)</small></label>
        <label>Дата окончания обучения:<input type="date" value={endDate} onChange={handleEndDateChange} /><small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '12px' }}>(Если выходной день - обучение закончится в пятницу)</small></label>
        
        {dateError && (
          <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px', width: '100%' }}>
            ⚠️ {dateError}
          </div>
        )}
        <label>Количество курсов:
          <select value={courses.length} onChange={(e) => setCoursesCount(+e.target.value)}>
            {Array.from({ length: MAX_COURSES }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table className="calendar-plan__table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th rowSpan={2}>Курс</th>
              <th colSpan={WEEK_AUTUMN}>Осенний семестр</th>
              <th colSpan={WEEK_SPRING}>Весенний семестр</th>
              <th colSpan={3}>Теория</th>
              <th rowSpan={2}>Экз.</th><th rowSpan={2}>Уч.</th><th rowSpan={2}>Друг.</th>
              <th rowSpan={2}>Предд.</th><th rowSpan={2}>НИР</th><th rowSpan={2}>ГИА</th>
              <th rowSpan={2}>Каник.</th><th rowSpan={2}>Всего</th>
            </tr>
            <tr>
              {Array.from({ length: WEEK_COUNT }, (_, i) => (
                <th key={i} title={weekDateRanges[i]} style={{ padding: '5px', writingMode: 'sideways-lr' }}>
                  <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.1', letterSpacing: '0.5px', fontSize: '12px' }}>
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
              const spring = c.weeks.slice(WEEK_AUTUMN);
              const theoryO = count(autumn, ['', 'С']);
              const theoryV = count(spring, ['', 'С']);
              return (
                <tr key={c.course}>
                  <td>{c.course}</td>
                  {c.weeks.map((w, wi) => {
                    const isInvalidWeek = w && !isAllowedWeekCode(w);
                    const cell_id = `calendar-plan-cell-course-${ci}-week-${wi}`;
                    return (
                      <td key={wi}>
                        <input
                          id={cell_id}
                          className={`calendar-plan__week-input${isInvalidWeek ? ' calendar-plan__week-input_invalid' : ''}`}
                          value={w}
                          maxLength={1}
                          onChange={(e) => updateWeek(ci, wi, e.target.value.toUpperCase())}
                          onFocus={(e) => { onCellFocus(e); }}
                          onKeyDown={(e) => { onCellKeyPress(e, ci, wi); }}
                        />
                      </td>
                    );
                  })}
                  <td className="calendar-plan__summary">{theoryO}</td>
                  <td className="calendar-plan__summary">{theoryV}</td>
                  <td className="calendar-plan__summary">{theoryO + theoryV}</td>
                  <td>{count(c.weeks, ['С'])}</td><td>{count(c.weeks, ['У'])}</td>
                  <td>{count(c.weeks, ['П'])}</td><td>{count(c.weeks, ['Д'])}</td>
                  <td>{count(c.weeks, ['Н'])}</td><td>{count(c.weeks, ['Г'])}</td>
                  <td>{count(c.weeks, ['='])}</td>
                  <td className="calendar-plan__summary">{WEEK_COUNT}</td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 'bold', background: '#f3f3f3' }}>
              <td>Итого</td>
              {Array.from({ length: WEEK_COUNT }).map((_, i) => (<td key={i}></td>))}
              <td>{totals.tAutumn}</td><td>{totals.tSpring}</td><td>{totals.tTotal}</td>
              <td>{totals.exams}</td><td>{totals.study}</td><td>{totals.other}</td>
              <td>{totals.pre}</td><td>{totals.nir}</td><td>{totals.gia}</td>
              <td>{totals.holidays}</td><td>{totals.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="calendar-plan__legend">
        <div>С — экзаменационная сессия</div><div>У — учебная практика</div>
        <div>П — другие практики</div><div>Д — преддипломная практика</div>
        <div>Н — НИР</div><div>Г — ГИА</div><div>= — каникулы</div>
        <div>(пусто) — теоретическое обучение</div>
      </div>
      
      <div className="calendar-plan__actions">
        <button onClick={handleSave} style={dateError ? { opacity: 0.5, cursor: 'not-allowed' } : {}} disabled={!!dateError}>
          Сохранить календарный план
        </button>
      </div>
      <div className="calendar-plan__actions">
        <button
          onClick={() => { if (!dateError) { exportCalendarPlan({ data }); } }}
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