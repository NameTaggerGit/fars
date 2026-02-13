/**
 * Проверяет, является ли сегодня днем рождения пользователя
 */
export function isBirthdayToday(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
}

/**
 * Вычисляет количество дней до следующего дня рождения
 * Возвращает 0, если сегодня день рождения
 * Возвращает null, если дата рождения не указана
 */
export function daysUntilBirthday(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const currentYear = today.getFullYear();
  
  // Создаем дату дня рождения в текущем году
  const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  
  // Если день рождения уже прошел в этом году, берем следующий год
  const nextBirthday = today > thisYearBirthday
    ? new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate())
    : thisYearBirthday;
  
  // Вычисляем разницу в днях
  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Форматирует текст "через N дней" для дня рождения
 */
export function formatDaysUntilBirthday(dateOfBirth: string | null | undefined): string {
  const days = daysUntilBirthday(dateOfBirth);
  if (days === null) return '';
  if (days === 0) return 'Сегодня день рождения! 🎉';
  if (days === 1) return 'Завтра день рождения';
  return `Через ${days} ${getDaysWord(days)}`;
}

function getDaysWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
}

/**
 * Получает месяц и день из даты рождения для сортировки
 */
export function getBirthdayMonthDay(dateOfBirth: string | null | undefined): { month: number; day: number } | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  return { month: birthDate.getMonth(), day: birthDate.getDate() };
}
