/** Авторы работы — обложка (сцена 01), финал (сцена 15), текст выступления и README. */
export const AUTHORS = ['Зафарбек Якубов', 'Зилола Фарходова', 'Юлиана Истратова'] as const;
export const GROUP = 'RB 25-01';
export const TEACHER = 'Парвиз Мамедов';

/** «А, Б и В» — для текста выступления. */
export const AUTHORS_TEXT = `${AUTHORS.slice(0, -1).join(', ')} и ${AUTHORS[AUTHORS.length - 1]}`;
