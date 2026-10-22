/**
 * Список литературы (2021–2026). Каждая позиция проверена по первоисточнику
 * 22.10.2026 — подробности и цитаты в docs/research-notes.md, полный список в docs/SOURCES.md.
 */
export interface Source {
  id: string;
  /** Краткая запись для экрана. */
  short: string;
  /** Издатель или сайт — подпись ссылки. */
  site: string;
  year: number;
  url: string;
  kind: 'law' | 'book' | 'report' | 'stat';
}

export const SOURCES: readonly Source[] = [
  {
    id: 'labour-code',
    short: 'Трудовой кодекс Республики Узбекистан (утв. Законом от 28.10.2022 № ЗРУ-798, в силе с 30.04.2023)',
    site: 'lex.uz',
    year: 2022,
    url: 'https://lex.uz/ru/docs/6257291',
    kind: 'law',
  },
  {
    id: 'tax-code',
    short: 'Налоговый кодекс Республики Узбекистан (ред. 2026 г.): ст. 381, 385, 405',
    site: 'lex.uz',
    year: 2026,
    url: 'https://lex.uz/ru/docs/4674893',
    kind: 'law',
  },
  {
    id: 'uz2030',
    short: 'Указ Президента РУз от 11.09.2023 № УП-158 «О Стратегии «Узбекистан — 2030»»',
    site: 'lex.uz',
    year: 2023,
    url: 'https://lex.uz/ru/docs/6600404',
    kind: 'law',
  },
  {
    id: 'kibanov',
    short: 'Кибанов А. Я. Управление персоналом организации: учебник. — 4-е изд. — М.: ИНФРА-М, 2023. — 695 с.',
    site: 'znanium.ru',
    year: 2023,
    url: 'https://znanium.ru/catalog/product/1951170',
    kind: 'book',
  },
  {
    id: 'armstrong',
    short: "Armstrong M., Taylor S. Armstrong's Handbook of Human Resource Management Practice. 16th ed. — Kogan Page, 2023",
    site: 'ISBN 978-1-3986-0663-0',
    year: 2023,
    url: 'https://openlibrary.org/books/OL38181609M',
    kind: 'book',
  },
  {
    id: 'dessler',
    short: 'Dessler G. Human Resource Management. 17th ed. — Pearson, 2024',
    site: 'pearson.com',
    year: 2024,
    url: 'https://www.pearson.com/en-us/subject-catalog/p/human-resource-management/P200000009678/9780137930654',
    kind: 'book',
  },
  {
    id: 'gallup-2026',
    short: 'Gallup. State of the Global Workplace: 2026 Report',
    site: 'gallup.com',
    year: 2026,
    url: 'https://www.gallup.com/file/workplace/707798/state-of-the-global-workplace-2026-download.pdf',
    kind: 'report',
  },
  {
    id: 'wef-2025',
    short: 'World Economic Forum. The Future of Jobs Report 2025',
    site: 'weforum.org',
    year: 2025,
    url: 'https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf',
    kind: 'report',
  },
  {
    id: 'manpower-2026',
    short: 'ManpowerGroup. Global Talent Shortage 2026: пресс-релиз от 26.02.2026',
    site: 'manpowergroup.com',
    year: 2026,
    url: 'https://investor.manpowergroup.com/node/68796',
    kind: 'report',
  },
  {
    id: 'linkedin-2024',
    short: 'LinkedIn Learning. Workplace Learning Report 2024',
    site: 'linkedin.com',
    year: 2024,
    url: 'https://learning.linkedin.com/content/dam/lem/business/en/learn/resources/workplace-learning-report-2024/LinkedIn-Workplace-Learning-Report-2024.pdf',
    kind: 'report',
  },
  {
    id: 'deloitte-2025',
    short: 'Deloitte. 2025 Global Human Capital Trends',
    site: 'deloitte.com',
    year: 2025,
    url: 'https://www.deloitte.com/us/en/services/consulting/articles/human-capital-and-hr-trends-thought-leadership.html',
    kind: 'report',
  },
  {
    id: 'stat-uz-2026',
    short: 'Нацкомстат РУз. Среднемесячная номинальная начисленная заработная плата, январь–июнь 2026 г.',
    site: 'stat.uz',
    year: 2026,
    url: 'https://stat.uz/img/press-relizlar/ish-haqi--rus_p84215.pdf',
    kind: 'stat',
  },
  {
    id: 'hh-2025',
    short: 'hh.uz. Рынок труда в сфере информационных технологий: итоги 2025 года (18.02.2026)',
    site: 'hh.uz',
    year: 2026,
    url: 'https://hh.uz/article/34221',
    kind: 'stat',
  },
] as const;
