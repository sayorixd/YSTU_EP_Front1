// app/common/CalendarPlanCommon.tsx
export const WEEK_AUTUMN = 22; // 22 недели с 1 сентября = ~31 января
export const WEEK_SPRING = 22; // 22 недели (февраль - конец июня)
export const WEEK_SUMMER = 8;  // 8 недель (июль - август)
export const WEEK_COUNT = 52;
export const MAX_COURSES = 6;

export function parseDateStr(dateStr: string) {
  return dateStr.split('-').map(Number);
}

export function getAcademicStartDate(year: number): string {
  let date = new Date(year, 8, 1); // 1 сентября
  const day = date.getDay();
  if (day === 0) {
    date = new Date(year, 8, 2); // Если воскресенье -> понедельник
  }
  return date.toISOString().split('T')[0];
}

export function getCourseEndDate(year: number): string {
  const date = new Date(year, 5, 30); // 30 июня
  return date.toISOString().split('T')[0];
}

export function calculateAcademicData(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  let current = new Date(start);
  let academicWeeks = 0;
  while (current < end) {
    const month = current.getMonth();
    if (month !== 6 && month !== 7) { // Исключаем июль и август
      academicWeeks++;
    }
    current.setDate(current.getDate() + 7);
  }
  const courseCount = Math.max(1, Math.ceil(academicWeeks / 52));
  return { academicWeeks, courseCount };
}

export function generateWeekDateRanges(startDateStr: string): string[] {
  const weekRanges: string[] = [];
  let [year, month, day] = parseDateStr(startDateStr);
  let currentDate = new Date(year, month - 1, day);

  const formatDate = (date: Date): string => {
    const d = date.getDate();
    let m = date.toLocaleDateString('ru-RU', { month: 'short' });
    m = m.slice(0, 3);
    return `${d} ${m}`;
  };

  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i < WEEK_COUNT; i++) {
    const dayOfWeek = currentDate.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    let weekEnd = new Date(currentDate.getTime() + daysUntilSunday * DAY_MS);

    weekRanges.push(`${formatDate(currentDate)} - ${formatDate(weekEnd)}`);
    currentDate = new Date(weekEnd.getTime() + DAY_MS);
  }

  return weekRanges;
}