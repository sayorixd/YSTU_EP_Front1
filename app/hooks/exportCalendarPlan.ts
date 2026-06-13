// app/hooks/exportCalendarPlan.ts
import * as XLSX from 'xlsx-js-style';
import { 
  WEEK_AUTUMN, 
  WEEK_SPRING, 
  WEEK_SUMMER, // <--- Добавили
  WEEK_COUNT, 
  generateWeekDateRanges 
} from '../common/CalendarPlanCommon';

function combineBorderStyles(worksheet: any, cellAddress: string, style: any) {
  if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
  let s = worksheet[cellAddress].s || {};
  s.border = s.border || {};
  for (let key of Object.keys(style.border)) {
    s.border[key] = style.border[key];
  }
  worksheet[cellAddress].s = s;
  return s;
}

function combineAlignment(worksheet: any, cellAddress: string, alignment: any) {
  if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
  let s = worksheet[cellAddress].s || {};
  s.alignment = s.alignment || {};
  for (let key of Object.keys(alignment.alignment)) {
    s.alignment[key] = alignment.alignment[key];
  }
  worksheet[cellAddress].s = s;
  return s;
}

function combineFont(worksheet: any, cellAddress: string, font: any) {
  if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
  let s = worksheet[cellAddress].s || {};
  s.font = s.font || {};
  for (let key of Object.keys(font.font)) {
    s.font[key] = font.font[key];
  }
  worksheet[cellAddress].s = s;
  return s;
}

export function exportCalendarPlan(plan: any) {
  const data = plan.data;
  if (!data || !Array.isArray(data.courses)) {
    alert('Нет данных для экспорта');
    return;
  }

  const startDate = data.start_date || `${data.academic_year}-09-01`;
  const weekDateRanges = generateWeekDateRanges(startDate);
  const rows: any[][] = [];

  /* ---------- Заголовок документа ---------- */
  rows.push(['КАЛЕНДАРНЫЙ УЧЕБНЫЙ ГРАФИК']);
  rows.push([`Название: ${data.title}`]);
  rows.push([`Учебный год: ${data.academic_year}`]);
  rows.push([`Группа: ${data.group}`]);
  rows.push([`Профиль: ${data.profile}`]);
  rows.push([`Регистрационный номер: ${data.reg_number}`]);
  rows.push([`Дата начала обучения: ${startDate}`]);
  rows.push([`Дата окончания обучения: ${data.end_date}`]);
  rows.push([]);

  let tableBeginRow = rows.length;

  /* ---------- Заголовки таблицы ---------- */
  rows.push([
    'Курс',
    'Осенний семестр',
    ...Array(WEEK_AUTUMN - 1).fill(''),
    'Весенний семестр',
    ...Array(WEEK_SPRING - 1).fill(''),
    'Летний период', // <--- Добавили
    ...Array(WEEK_SUMMER - 1).fill(''),
    'Теоретическое обучение', '', '',
    'Экзаменационные сессии',
    'Учебная практика',
    'Другие практики',
    'Преддипломная практика',
    'НИР',
    'Гос. Итог. Атт.',
    'Каникулы',
    'Всего'
  ]);

  rows.push([
    '',
    ...weekDateRanges,
    'О', 'В', 'Σ', // <--- Исправлено с ∑ на Σ
    '', '', '', '', '', '', '', ''
  ]);

  /* ---------- Нумерация недель ---------- */
  let numbersWeekAutumn = Array.from({ length: WEEK_AUTUMN }, (_, i) => i + 1);
  let numbersWeekSpring = Array.from({ length: WEEK_SPRING }, (_, i) => i + 1);
  let numbersWeekSummer = Array.from({ length: WEEK_SUMMER }, (_, i) => i + 1); 
  
  rows.push([
    '',
    ...numbersWeekAutumn,
    ...numbersWeekSpring,
    ...numbersWeekSummer, // <--- Добавили
    '', '', '',
    '', '', '', '', '', '', '', ''
  ]);

  /* ---------- Строки курсов ---------- */
  data.courses.forEach((course: any) => {
    const weeks = course.weeks ?? Array(WEEK_COUNT).fill('');
    const autumnWeeks = weeks.slice(0, WEEK_AUTUMN);
    const springWeeks = weeks.slice(WEEK_AUTUMN, WEEK_AUTUMN + WEEK_SPRING); 
    
    const isTheory = (w: string) => w === '' || w === 'С';
    const countWeeks = (v: string) => weeks.filter((w: string) => w === v).length;
    
    const theoryAutumn = autumnWeeks.filter(isTheory).length;
    const theorySpring = springWeeks.filter(isTheory).length;
    const theoryTotal = theoryAutumn + theorySpring;
    
    const exams = countWeeks('С');
    const study = countWeeks('У');
    const other = countWeeks('П');
    const pre = countWeeks('Д');
    const nir = countWeeks('Н');
    const gia = countWeeks('Г');
    const holidays = countWeeks('=');
    const total = theoryTotal + exams + study + other + pre + nir + gia + holidays;

    rows.push([
      `Курс ${course.course}\n${course.start_date} –\n${course.end_date}`,
      ...weeks,
      theoryAutumn,
      theorySpring,
      theoryTotal,
      exams,
      study,
      other,
      pre,
      nir,
      gia,
      holidays,
      total,
    ]);
  });

  /* ---------- Легенда (Условные обозначения) ---------- */
  rows.push([]);
  rows.push(['Условные обозначения:']);
  rows.push(['С — теоретическое обучение (вкл. сессию)']);
  rows.push(['У — учебная практика']);
  rows.push(['П — другие практики']);
  rows.push(['Д — преддипломная практика']);
  rows.push(['Н — НИР']);
  rows.push(['Г — государственная итоговая аттестация']);
  rows.push(['= — каникулы']);
  rows.push(['(пусто) — теоретическое обучение']);

  /* ---------- Excel форматирование ---------- */
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const tableSpanHorizontal = 1 + WEEK_COUNT + 11; 
  const tableSpanVertical = 3 + data.courses.length; 

  // Ширина колонок
  if (!ws["!cols"]) ws["!cols"] = [];
  for (let C = 0; C < tableSpanHorizontal; C++) {
    if (C === 0) {
      ws["!cols"][C] = { wch: 16 }; 
    } else if (C >= 1 && C <= WEEK_COUNT) {
      ws["!cols"][C] = { wch: 3.2 }; 
    } else {
      // <--- ИСПРАВЛЕНО: Увеличили с 4 до 14, чтобы текст переносился по словам
      ws["!cols"][C] = { wch: 14 };   
    }
  }

  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][tableBeginRow + 1] = { hpt: 90 };

  // Объединение ячеек заголовка
  let merge = [
    [0, 0, 2, 0],                                       // Курс (занимает 3 строки: 0, 1, 2)
    [0, 1, 0, WEEK_AUTUMN],                             // Осенний семестр (только строка 0)
    [0, WEEK_AUTUMN + 1, 0, WEEK_AUTUMN + WEEK_SPRING], // Весенний семестр (только строка 0)
    [0, WEEK_AUTUMN + WEEK_SPRING + 1, 0, WEEK_COUNT],  // Летний период (только строка 0)
    
    // ИСПРАВЛЕНО: Теория теперь занимает ТОЛЬКО строку 0 (было 1, стало 0)
    [0, WEEK_COUNT + 1, 0, WEEK_COUNT + 3],             // Теория (О, В, Σ) 
    
    // Остальные итоговые столбцы занимают 3 строки (0, 1, 2)
    [0, WEEK_COUNT + 4, 2, WEEK_COUNT + 4],             // Экз.
    [0, WEEK_COUNT + 5, 2, WEEK_COUNT + 5],             // Уч.
    [0, WEEK_COUNT + 6, 2, WEEK_COUNT + 6],             // Друг.
    [0, WEEK_COUNT + 7, 2, WEEK_COUNT + 7],             // Предд.
    [0, WEEK_COUNT + 8, 2, WEEK_COUNT + 8],             // НИР
    [0, WEEK_COUNT + 9, 2, WEEK_COUNT + 9],             // ГИА
    [0, WEEK_COUNT + 10, 2, WEEK_COUNT + 10],           // Каник.
    [0, WEEK_COUNT + 11, 2, WEEK_COUNT + 11],           // Всего
  ];

  ws["!merges"] = merge.map(m => ({
    s: { r: m[0] + tableBeginRow, c: m[1] },
    e: { r: m[2] + tableBeginRow, c: m[3] }
  }));

  // Стили
  let borderStyle = { border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }};
  
  let centerAlign = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  let rotateAlign = { alignment: { textRotation: 90, horizontal: 'center', vertical: 'center', wrapText: false } };

  for (let R = tableBeginRow; R < tableBeginRow + tableSpanVertical; R++) {
    for (let C = 0; C < tableSpanHorizontal; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      combineBorderStyles(ws, cellAddress, borderStyle);

      if (C === 0) {
        combineAlignment(ws, cellAddress, { alignment: { horizontal: 'left', vertical: 'center', wrapText: true } });
      } else if (C >= 1 && C <= WEEK_COUNT) {
        if (R === tableBeginRow + 1) {
          combineAlignment(ws, cellAddress, rotateAlign);
        } else {
          combineAlignment(ws, cellAddress, centerAlign);
        }
      } else {
        combineAlignment(ws, cellAddress, centerAlign);
      }
    }
  }

  let defaultFontStyle = { font: { name: "Arial", sz: 10 } };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, 'Календарный график');
  XLSX.writeFile(
    workbook,
    `Календарный_учебный_график_${data.group}_${data.academic_year}.xlsx`,
    { defaultCellStyle: defaultFontStyle }
  );
}