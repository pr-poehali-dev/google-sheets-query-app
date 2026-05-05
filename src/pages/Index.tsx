import { useState } from "react";
import Icon from "@/components/ui/icon";

type SectionKey = "contractors" | "contacts" | "payments" | "comments";

interface SearchResult {
  contractor: string;
  inn: string;
  contact: string;
  comment: string;
  paymentDate: string;
}

interface Section {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

const SECTIONS: Section[] = [
  {
    key: "contractors",
    label: "Статус документов",
    icon: "FileText",
    description: "Поиск документов по ИНН контрагента",
    colorClass: "border-l-blue-700",
  },
  {
    key: "contacts",
    label: "Контакты",
    icon: "Users",
    description: "Контактные данные контрагента по ИНН",
    colorClass: "border-l-indigo-600",
  },
  {
    key: "payments",
    label: "Дата платежей",
    icon: "CalendarDays",
    description: "График платежей контрагента по ИНН",
    colorClass: "border-l-teal-600",
  },
  {
    key: "comments",
    label: "Комментарии",
    icon: "MessageSquare",
    description: "Комментарии и заметки по контрагенту",
    colorClass: "border-l-amber-500",
  },
];

const MOCK_DATA: Record<string, SearchResult> = {
  "7707083893": {
    contractor: "ПАО Сбербанк",
    inn: "7707083893",
    contact: "Иванов Иван Иванович, +7 (495) 500-55-50",
    comment: "Основной банк-партнёр. Договор действует до 31.12.2026.",
    paymentDate: "15-е число каждого месяца",
  },
  "5010011241": {
    contractor: "ООО «ТехноПром»",
    inn: "5010011241",
    contact: "Петрова Мария Сергеевна, +7 (916) 123-45-67",
    comment: "Поставщик оборудования. Требуется перезаключение договора.",
    paymentDate: "1-е и 16-е числа месяца",
  },
  "7743013902": {
    contractor: "АО «Газпром Нефть»",
    inn: "7743013902",
    contact: "Сидоров Алексей Павлович, +7 (812) 240-44-44",
    comment: "Долгосрочный контракт на поставку ГСМ. Приоритетный контрагент.",
    paymentDate: "По выставленным счетам в течение 5 рабочих дней",
  },
};

const COLUMNS_MAP: Record<SectionKey, { label: string; field: keyof SearchResult }[]> = {
  contractors: [
    { label: "Контрагент", field: "contractor" },
    { label: "ИНН", field: "inn" },
    { label: "Комментарий", field: "comment" },
  ],
  contacts: [
    { label: "Контрагент", field: "contractor" },
    { label: "ИНН", field: "inn" },
    { label: "Контакт", field: "contact" },
  ],
  payments: [
    { label: "Контрагент", field: "contractor" },
    { label: "ИНН", field: "inn" },
    { label: "Дата платежей", field: "paymentDate" },
  ],
  comments: [
    { label: "Контрагент", field: "contractor" },
    { label: "ИНН", field: "inn" },
    { label: "Комментарий", field: "comment" },
  ],
};

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const openSection = (section: Section) => {
    setActiveSection(section);
    setQuery("");
    setResult(null);
    setNotFound(false);
  };

  const closeModal = () => {
    setActiveSection(null);
    setQuery("");
    setResult(null);
    setNotFound(false);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    setTimeout(() => {
      const found = MOCK_DATA[query.trim()];
      if (found) {
        setResult(found);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const columns = activeSection ? COLUMNS_MAP[activeSection.key] : [];

  return (
    <div className="min-h-screen bg-[hsl(216,28%,97%)] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[hsl(220,65%,22%)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/15 rounded flex items-center justify-center">
              <Icon name="Database" size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-wide leading-tight">
                База контрагентов
              </h1>
              <p className="text-white/50 text-xs font-light tracking-widest uppercase">
                Информационная система
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span>Подключено</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="mb-10 animate-fade-in">
          <h2 className="text-2xl font-semibold text-[hsl(220,65%,22%)] mb-1">
            Поиск по базе
          </h2>
          <p className="text-[hsl(215,16%,48%)] text-sm">
            Выберите раздел для поиска информации о контрагенте по ИНН
          </p>
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {SECTIONS.map((section, i) => (
            <button
              key={section.key}
              onClick={() => openSection(section)}
              className={`bg-white border border-[hsl(214,20%,86%)] border-l-4 ${section.colorClass} rounded-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}
              style={{ animation: `slideUp 0.3s ease-out ${i * 60}ms both` }}
            >
              <div className="w-9 h-9 bg-[hsl(220,65%,22%)]/10 rounded flex items-center justify-center mb-4">
                <Icon name={section.icon as "FileText"} size={18} className="text-[hsl(220,65%,22%)]" />
              </div>
              <div className="text-sm font-semibold text-[hsl(220,65%,22%)] mb-1">
                {section.label}
              </div>
              <div className="text-xs text-[hsl(215,16%,48%)] leading-snug">
                {section.description}
              </div>
              <div className="mt-4 flex items-center gap-1 text-[hsl(210,80%,50%)] text-xs font-medium">
                <span>Открыть поиск</span>
                <Icon name="ArrowRight" size={12} />
              </div>
            </button>
          ))}
        </div>

        {/* Info block */}
        <div className="border border-[hsl(214,20%,86%)] border-l-4 border-l-[hsl(210,80%,50%)] bg-white rounded-sm px-5 py-4 flex gap-3 items-start">
          <Icon name="Info" size={16} className="text-[hsl(210,80%,50%)] mt-0.5 shrink-0" />
          <p className="text-sm text-[hsl(215,16%,48%)] leading-relaxed">
            Данные загружаются из Google Таблиц в реальном времени. После подключения вашей таблицы
            введите ИНН в любом разделе — система найдёт строку и вернёт нужные столбцы.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(214,20%,86%)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-[hsl(215,16%,48%)]">
          <span>База контрагентов © 2026</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>

      {/* Modal */}
      {activeSection && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden"
               style={{ animation: "scaleIn 0.2s ease-out both" }}>
            {/* Modal header */}
            <div className="bg-[hsl(220,65%,22%)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded flex items-center justify-center">
                  <Icon name={activeSection.icon as "FileText"} size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{activeSection.label}</h3>
                  <p className="text-white/50 text-xs">{activeSection.description}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white/50 hover:text-white transition-colors p-1 rounded"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-[hsl(215,16%,48%)] uppercase tracking-wider mb-2">
                Введите ИНН
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Например: 7707083893"
                  className="flex-1 border border-[hsl(214,20%,86%)] rounded-sm px-3 py-2.5 text-sm font-mono placeholder:text-[hsl(215,16%,70%)] focus:outline-none focus:border-[hsl(210,80%,50%)] focus:ring-1 focus:ring-[hsl(210,80%,50%)]/30 transition-colors text-[hsl(220,40%,10%)]"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || loading}
                  className="bg-[hsl(220,65%,22%)] text-white px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-[hsl(220,65%,18%)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <Icon name="Loader2" size={15} className="animate-spin" />
                  ) : (
                    <Icon name="Search" size={15} />
                  )}
                  Найти
                </button>
              </div>

              {/* Results table */}
              {result && (
                <div className="mt-5" style={{ animation: "fadeIn 0.25s ease-out both" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="CheckCircle2" size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      Найдено
                    </span>
                  </div>
                  <div className="border border-[hsl(214,20%,86%)] rounded-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[hsl(220,65%,22%)]">
                          {columns.map((col) => (
                            <th
                              key={col.field}
                              className="text-left px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-wider"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="data-row">
                          {columns.map((col, idx) => (
                            <td
                              key={col.field}
                              className={`px-4 py-3 border-b border-[hsl(214,20%,86%)] text-[hsl(220,40%,10%)] transition-colors align-top ${
                                idx === 1 ? "font-mono text-xs" : ""
                              }`}
                            >
                              {result[col.field]}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {notFound && (
                <div className="mt-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3"
                     style={{ animation: "fadeIn 0.25s ease-out both" }}>
                  <Icon name="AlertCircle" size={15} className="text-red-500 shrink-0" />
                  <span className="text-sm text-red-700">
                    Контрагент с ИНН{" "}
                    <span className="font-mono font-semibold">{query}</span>{" "}
                    не найден в таблице.
                  </span>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 bg-[hsl(216,28%,97%)] border-t border-[hsl(214,20%,86%)] flex justify-end">
              <button
                onClick={closeModal}
                className="text-xs text-[hsl(215,16%,48%)] hover:text-[hsl(220,65%,22%)] transition-colors flex items-center gap-1.5"
              >
                <Icon name="X" size={12} />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
