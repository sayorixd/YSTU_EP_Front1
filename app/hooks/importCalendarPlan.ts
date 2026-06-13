// app/hooks/importCalendarPlan.ts
import * as XLSX from 'xlsx-js-style';
import { WEEK_COUNT } from '../common/CalendarPlanCommon';

export function importCalendarPlan(file: File, onLoad: (data: any) => void) {
  console.log('📖 importCalendarPlan: начало чтения файла', file.name);
  const reader = new FileReader();

  reader.onload = (e) => {
    console.log('📖 importCalendarPlan: файл прочитан в буфер');
    const buffer = e.target?.result;
    if (!buffer) {
      console.error('❌ importCalendarPlan: буфер пуст');
      return;
    }

    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      console.log('📖 importCalendarPlan: книга прочита, листы:', workbook.SheetNames);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        defval: '', // <--- ВАЖНО: Заполняем пустые ячейки пустой строкой, чтобы массив не "схлопывался"
      });
      
      console.log('📖 importCalendarPlan: строк прочитано:', rows.length);

      const meta: any = {
        title: '',
        academic_year: '',
        group: '',
        profile: '',
        reg_number: '',
        start_date: '',
        end_date: '',
      };

      // Парсинг шапки (метаданных)
      rows.forEach((row) => {
        if (!row || row.length === 0) return;
        const key = String(row[0] || '').trim();
        const val = String(row[1] !== undefined ? row[1] : '').trim();
        const fullText = val ? `${key} ${val}` : key;

        if (key.startsWith('Название') || fullText.includes('Название')) {
          meta.title = val || key.replace(/Название[:\s]*/i, '').trim();
        } else if (key.startsWith('Учебный год') || fullText.includes('Учебный год')) {
          meta.academic_year = val || key.replace(/Учебный год[:\s]*/i, '').trim();
        } else if (key.startsWith('Группа') || fullText.includes('Группа')) {
          meta.group = val || key.replace(/Группа[:\s]*/i, '').trim();
        } else if (key.startsWith('Профиль') || fullText.includes('Профиль')) {
          meta.profile = val || key.replace(/Профиль[:\s]*/i, '').trim();
        } else if (key.startsWith('Регистрационный номер') || fullText.includes('Регистрационный номер')) {
          meta.reg_number = val || key.replace(/Регистрационный номер[:\s]*/i, '').trim();
        } else if (key.startsWith('Дата начала') || fullText.includes('Дата начала')) {
          meta.start_date = val || key.replace(/Дата начала обучения[:\s]*/i, '').trim();
        } else if (key.startsWith('Дата окончания') || fullText.includes('Дата окончания')) {
          meta.end_date = val || key.replace(/Дата окончания обучения[:\s]*/i, '').trim();
        }
      });

      // Поиск строки с заголовками таблицы
      const headerIndex = rows.findIndex((r) => String(r[0]).trim() === 'Курс');
      if (headerIndex === -1) {
        alert('Не найдена таблица календарного графика (строка с заголовком "Курс")');
        console.error('❌ importCalendarPlan: не найдена строка "Курс"');
        return;
      }

      const courses: any[] = [];
      // Идем по строкам после заголовка
      for (let i = headerIndex + 3; i < rows.length; i++) { // +3 пропускаем заголовки и номера недель
        const row = rows[i];
        if (!row) continue;
        
        const courseText = String(row[0]).trim();
        
        // Останавливаемся, если началась легенда или пустые строки
        if (courseText === '' || courseText.startsWith('Условные обозначения')) {
          if (courses.length > 0) break; 
          continue;
        }

        // Надежно извлекаем номер курса из текста вида "Курс 1\n2024-09-01 –\n2025-08-31"
        const courseMatch = courseText.match(/Курс\s*(\d+)/i);
        const courseNumber = courseMatch ? Number(courseMatch[1]) : Number(courseText);
        
        if (!courseNumber || isNaN(courseNumber)) continue;

        // <--- ГЛАВНОЕ ИСПРАВЛЕНИЕ: Жестко генерируем массив из 52 элементов
        // Это гарантирует, что летние недели и пустые ячейки не сломают индексы
        const weeks = Array.from({ length: WEEK_COUNT }, (_, idx) => {
          const val = row[1 + idx];
          return typeof val === 'string' ? val.trim().toUpperCase() : '';
        });

        courses.push({ course: courseNumber, weeks });
      }

      if (!courses.length) {
        alert('Курсы не найдены в файле');
        console.error('❌ importCalendarPlan: курсы не найдены');
        return;
      }

      // === ГЕНЕРАЦИЯ ИЛИ ПАРСИНГ ДАТ ===
      let startDate = meta.start_date;
      let endDate = meta.end_date;

      const parseDate = (dateStr: string) => {
        if (!dateStr) return '';
        const match = dateStr.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
        if (match) {
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        return '';
      };

      startDate = parseDate(startDate);
      endDate = parseDate(endDate);

      if (!startDate || !endDate) {
        const textToSearch = meta.academic_year || meta.title || '';
        const yearMatch = textToSearch.match(/(\d{4})/);
        if (yearMatch) {
          const startYear = yearMatch[1];
          const endYear = String(Number(startYear) + 1);
          startDate = startDate || `${startYear}-09-01`;
          endDate = endDate || `${endYear}-08-31`;
          console.log('📅 importCalendarPlan: даты сгенерированы из года:', startDate, endDate);
        } else {
          const currentYear = new Date().getFullYear();
          startDate = startDate || `${currentYear}-09-01`;
          endDate = endDate || `${currentYear + 1}-08-31`;
          console.log('📅 importCalendarPlan: даты сгенерированы из текущего года:', startDate, endDate);
        }
      }

      const resultData = {
        ...meta,
        start_date: startDate,
        end_date: endDate,
        courses,
      };

      console.log('✅ importCalendarPlan: результат парсинга готов', resultData);
      onLoad(resultData);

    } catch (err) {
      console.error('❌ importCalendarPlan: критическая ошибка парсинга', err);
      alert('Ошибка при чтении файла Excel. Убедитесь, что это корректный файл, экспортированный из системы.');
    }
  };

  reader.onerror = (err) => {
    console.error('❌ importCalendarPlan: ошибка чтения файла', err);
    alert('Ошибка при чтении файла с диска');
  };

  reader.readAsArrayBuffer(file);
}