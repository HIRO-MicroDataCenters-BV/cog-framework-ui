/**
 * Типы и интерфейсы для работы с таблицами
 */

/**
 * Интерфейс для элемента данных таблицы
 */
export interface DataItem {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  last_update: string;
}

/**
 * Расширенный тип фильтра для поддержки свойства column
 */
export interface SearchFilter {
  id: string;
  value: unknown;
  column?: string;
}
