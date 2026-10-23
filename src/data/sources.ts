/**
 * Список литературы (2021–2026) по управлению проектами. Каждая позиция проверена
 * 22.10.2026 — подробности, цитаты и статус проверки в docs/research-notes.md,
 * полный список по ГОСТ — в docs/SOURCES.md.
 */
export interface Source {
  id: string;
  /** Краткая запись для экрана. */
  short: string;
  /** Издатель или сайт — подпись ссылки. */
  site: string;
  year: number;
  url: string;
  kind: 'standard' | 'book' | 'report' | 'law';
}

export const SOURCES: readonly Source[] = [
  {
    id: 'pmbok8',
    short: 'PMBOK® Guide and The Standard for Project Management. 8th ed. — PMI, 2025',
    site: 'pmi.org',
    year: 2025,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/publications/pmbok-guide-eighth-edition_table-of-contents.pdf',
    kind: 'standard',
  },
  {
    id: 'pmbok7',
    short: 'PMBOK® Guide and The Standard for Project Management. 7th ed. — PMI, 2021',
    site: 'pmi.org',
    year: 2021,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/pmbok-standards/pmbok-guide-public-faqs-1-july-2021.pdf',
    kind: 'standard',
  },
  {
    id: 'process-groups',
    short: 'Process Groups: A Practice Guide. — PMI, 2022',
    site: 'ISBN 978-1-62825-783-0',
    year: 2022,
    url: 'https://pmi.bookstore.ipgbook.com/process-groups--a-practice-guide-products-9781628257830.php',
    kind: 'standard',
  },
  {
    id: 'agile-guide',
    short: 'Agile Practice Guide. 2nd ed. — PMI, Agile Alliance, 2026',
    site: 'ISBN 978-1-62825-831-8',
    year: 2026,
    url: 'https://newsouthbooks.com.au/books/agile-practice-guide-second-edition-english/',
    kind: 'standard',
  },
  {
    id: 'kerzner',
    short: 'Kerzner H. Project Management: A Systems Approach to Planning, Scheduling, and Controlling. 13th ed. — Wiley, 2022',
    site: 'wiley.com',
    year: 2022,
    url: 'https://www.wiley.com/en-us/Project+Management%3A+A+Systems+Approach+to+Planning%2C+Scheduling%2C+and+Controlling%2C+13th+Edition-p-9781119805373',
    kind: 'book',
  },
  {
    id: 'rogova',
    short: 'Управление проектами: учебник и практикум / под ред. Е. М. Роговой. — М.: Юрайт, 2026. — 302 с.',
    site: 'urait.ru',
    year: 2026,
    url: 'https://urait.ru/bcode/582619',
    kind: 'book',
  },
  {
    id: 'gorbashko',
    short: 'Горбашко Е. А. Управление проектами: учебник для вузов. — М.: Юрайт, 2026. — 358 с.',
    site: 'urait.ru',
    year: 2026,
    url: 'https://urait.ru/bcode/589651',
    kind: 'book',
  },
  {
    id: 'schwaber',
    short: 'Швабер К. Скрам: гибкое управление продуктом и бизнесом. — М.: Альпина Паблишер, 2024. — 236 с.',
    site: 'alpinabook.ru',
    year: 2024,
    url: 'https://alpinabook.ru/catalog/book-skram/',
    kind: 'book',
  },
  {
    id: 'pulse-2026',
    short: 'PMI. Pulse of the Profession® 2026: Driving Success in Complex Projects',
    site: 'pmi.org',
    year: 2026,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/pulse-of-the-profession_2026_pdf.pdf',
    kind: 'report',
  },
  {
    id: 'talent-gap-2025',
    short: 'PMI. Global Project Management Talent Gap, 2025',
    site: 'pmi.org',
    year: 2025,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/talent_gap_2025-v3.pdf',
    kind: 'report',
  },
  {
    id: 'pulse-2024',
    short: 'PMI. Pulse of the Profession® 2024: The Future of Project Work',
    site: 'pmi.org',
    year: 2024,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/pmi-pulse-of-the-profession-2024-report.pdf',
    kind: 'report',
  },
  {
    id: 'success-2024',
    short: 'PMI. Maximizing Project Success, 2024',
    site: 'pmi.org',
    year: 2024,
    url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/project_success_report_2024.pdf',
    kind: 'report',
  },
  {
    id: 'cbinsights-2026',
    short: 'CB Insights. The top 9 reasons startups fail (обновлено 05.03.2026)',
    site: 'cbinsights.com',
    year: 2026,
    url: 'https://www.cbinsights.com/research/report/startup-failure-reasons-top/',
    kind: 'report',
  },
  {
    id: 'uz2030',
    short: 'Указ Президента РУз от 11.09.2023 № УП-158 «О Стратегии «Узбекистан — 2030»»',
    site: 'lex.uz',
    year: 2023,
    url: 'https://lex.uz/ru/docs/6600404',
    kind: 'law',
  },
] as const;
