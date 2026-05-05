import { useState } from "react";
import Icon from "@/components/ui/icon";

const SEARCH_INN_URL = "https://functions.poehali.dev/53084ea8-1999-43e8-bb8e-c710a430c4d9";

interface Section {
  key: string;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  let bg = "bg-gray-100 text-gray-700 border-gray-200";
  if (v.includes("актив") || v.includes("готов") || v.includes("оплач") || v.includes("подписан")) {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (v.includes("ожид") || v.includes("провер") || v.includes("процесс") || v.includes("рассмотр")) {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (v.includes("отклон") || v.includes("просрочен") || v.includes("отменён") || v.includes("закрыт")) {
    bg = "bg-red-50 text-red-700 border-red-200";
  } else if (v.includes("новый") || v.includes("создан")) {
    bg = "bg-blue-50 text-blue-700 border-blue-200";
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${bg}`}>
      {value}
    </span>
  );
}

const SECTIONS: Section[] = [
  {
    key: "contractors",
    label: "Статус документов",
    icon: "FileText",
    description: "Поиск по ИНН — статус документов",
    colorClass: "border-l-blue-700",
  },
  {
    key: "contacts",
    label: "Контакты",
    icon: "Users",
    description: "Поиск по ИНН — контактные данные",
    colorClass: "border-l-indigo-600",
  },
  {
    key: "payments",
    label: "Дата платежей",
    icon: "CalendarDays",
    description: "Поиск по ИНН — график платежей",
    colorClass: "border-l-teal-600",
  },
  {
    key: "comments",
    label: "Комментарии",
    icon: "MessageSquare",
    description: "Поиск по ИНН — заметки и комментарии",
    colorClass: "border-l-amber-500",
  },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSection = (section: Section) => {
    setActiveSection(section);
    setQuery("");
    setResult(null);
    setNotFound(false);
    setError(null);
  };

  const closeModal = () => {
    setActiveSection(null);
    setQuery("");
    setResult(null);
    setNotFound(false);
    setError(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);

    try {
      const resp = await fetch(SEARCH_INN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inn: query.trim() }),
      });

      const raw = await resp.json();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (data.found) {
        setResult(data.data);
      } else if (data.error) {
        setError(data.error);
      } else {
        setNotFound(true);
      }
    } catch {
      setError("Не удалось получить данные. Проверьте подключение к интернету.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

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
            Данные загружаются из Google Таблиц в реальном времени. Введите ИНН в любом разделе — система найдёт строку и вернёт все данные по контрагенту.
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
          <div
            className="bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden"
            style={{ animation: "scaleIn 0.2s ease-out both" }}
          >
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

              {/* Results */}
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
                          <th className="text-left px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-wider w-1/3">
                            Поле
                          </th>
                          <th className="text-left px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-wider">
                            Значение
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result).map(([key, value], idx) => (
                          <tr
                            key={key}
                            className={`data-row ${idx % 2 === 1 ? "bg-[hsl(216,28%,98%)]" : "bg-white"}`}
                          >
                            <td className="px-4 py-2.5 border-b border-[hsl(214,20%,86%)] text-[hsl(215,16%,48%)] font-medium text-xs">
                              {key === "Статус" ? (
                                <span className="flex items-center gap-1">
                                  <Icon name="Tag" size={11} className="text-[hsl(210,80%,50%)]" />
                                  {key}
                                </span>
                              ) : key}
                            </td>
                            <td className="px-4 py-2.5 border-b border-[hsl(214,20%,86%)] text-[hsl(220,40%,10%)]">
                              {key === "Статус" && value ? (
                                <StatusBadge value={value} />
                              ) : (
                                value || <span className="text-[hsl(215,16%,70%)] italic">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {notFound && (
                <div
                  className="mt-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3"
                  style={{ animation: "fadeIn 0.25s ease-out both" }}
                >
                  <Icon name="AlertCircle" size={15} className="text-red-500 shrink-0" />
                  <span className="text-sm text-red-700">
                    Контрагент с ИНН{" "}
                    <span className="font-mono font-semibold">{query}</span>{" "}
                    не найден в таблице.
                  </span>
                </div>
              )}

              {error && (
                <div
                  className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3"
                  style={{ animation: "fadeIn 0.25s ease-out both" }}
                >
                  <Icon name="TriangleAlert" size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">{error}</span>
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