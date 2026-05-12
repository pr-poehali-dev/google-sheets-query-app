import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SEARCH_INN_URL = "https://functions.poehali.dev/53084ea8-1999-43e8-bb8e-c710a430c4d9";
const ANALYZE_DDS_URL = "https://functions.poehali.dev/51c54ea1-5449-4228-873f-56122b967c6b";

interface Section {
  key: string;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

interface ChartItem {
  category: string;
  amount: number;
  percent: number;
}

interface DdsResult {
  quarter: number;
  year: number;
  date_start: string;
  date_end: string;
  rows_matched: number;
  total_income: number;
  total_expense: number;
  income_chart: ChartItem[];
  expense_chart: ChartItem[];
}

const CHART_COLORS = [
  "#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
  "#0e7490", "#0891b2", "#22d3ee", "#6d28d9", "#7c3aed",
  "#065f46", "#059669",
];

function formatMoney(v: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "decimal", maximumFractionDigits: 0 }).format(v) + " ₽";
}

function getQuarter(d: Date): number {
  return Math.ceil((d.getMonth() + 1) / 3);
}

function PieChart({ items, total }: { items: ChartItem[]; total: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!items.length || total === 0) {
    return <div className="text-center text-sm text-[hsl(215,16%,48%)] py-6">Нет данных</div>;
  }

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const innerR = 38;

  let cumAngle = -Math.PI / 2;
  const slices = items.map((item, i) => {
    const angle = (item.percent / 100) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${xi1} ${yi1}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      "Z",
    ].join(" ");

    return { path, color: CHART_COLORS[i % CHART_COLORS.length], item, i };
  });

  const hov = hovered !== null ? items[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map(({ path, color, i }) => (
            <path
              key={i}
              d={path}
              fill={color}
              stroke="white"
              strokeWidth={hovered === i ? 2 : 1}
              opacity={hovered === null || hovered === i ? 1 : 0.6}
              transform={hovered === i ? `translate(${Math.cos(-Math.PI/2 + (i + 0.5) * 2 * Math.PI / items.length) * 4}, ${Math.sin(-Math.PI/2 + (i + 0.5) * 2 * Math.PI / items.length) * 4})` : ""}
              style={{ cursor: "pointer", transition: "opacity 0.15s, transform 0.15s" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {hov ? (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="600">
                {hov.percent}%
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#64748b">
                {formatMoney(hov.amount)}
              </text>
            </>
          ) : (
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="9" fill="#64748b">
              {formatMoney(total)}
            </text>
          )}
        </svg>
      </div>
      <div className="w-full space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs cursor-pointer rounded px-1 py-0.5 transition-colors"
            style={{ background: hovered === i ? "#f1f5f9" : "transparent" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 text-[hsl(220,40%,10%)] truncate">{item.category}</span>
            <span className="text-[hsl(215,16%,48%)] shrink-0">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
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

const QUARTER_NAMES = ["", "I квартал", "II квартал", "III квартал", "IV квартал"];

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDds, setShowDds] = useState(false);
  const [ddsLoading, setDdsLoading] = useState(false);
  const [ddsResult, setDdsResult] = useState<DdsResult | null>(null);
  const [ddsError, setDdsError] = useState<string | null>(null);

  const today = new Date();
  const currentQuarter = getQuarter(today);
  const currentYear = today.getFullYear();
  const todayStr = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const openSection = (section: Section) => {
    setActiveSection(section);
    setQuery("");
    setResult(null);
    setNotFound(false);
    setError(null);
    setSent(false);
  };

  const closeModal = () => {
    setActiveSection(null);
    setQuery("");
    setResult(null);
    setNotFound(false);
    setError(null);
    setSent(false);
  };

  const closeDds = () => {
    setShowDds(false);
    setDdsResult(null);
    setDdsError(null);
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

  const handleSendTelegram = async () => {
    if (!result) return;
    setSending(true);
    setError(null);
    try {
      const BOT_TOKEN = "8670913054:AAEZkd0OUCzEjyrIXvzuJbhqOGltXe8dNRs";
      const CHAT_ID = "229904424";

      const lines = ["📋 *Запрос акта сверки*", ""];
      for (const [key, value] of Object.entries(result)) {
        if (value) lines.push(`*${key}:* ${value}`);
      }
      lines.push("");
      lines.push("_Просьба прислать акт сверки_");
      const text = lines.join("\n");

      const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
      });
      const data = await resp.json();
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.description || "Не удалось отправить сообщение");
      }
    } catch {
      setError("Ошибка соединения при отправке в Telegram");
    } finally {
      setSending(false);
    }
  };

  const handleAnalyzeDds = async () => {
    setDdsLoading(true);
    setDdsResult(null);
    setDdsError(null);
    try {
      const resp = await fetch(ANALYZE_DDS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter: currentQuarter, year: currentYear }),
      });
      const raw = await resp.json();
      const data: DdsResult = typeof raw === "string" ? JSON.parse(raw) : raw;
      setDdsResult(data);
    } catch {
      setDdsError("Не удалось загрузить данные из таблицы ДДС.");
    } finally {
      setDdsLoading(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        {/* ДДС кнопка */}
        <div className="mb-12">
          <button
            onClick={() => setShowDds(true)}
            className="bg-white border border-[hsl(214,20%,86%)] border-l-4 border-l-emerald-600 rounded-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full sm:w-auto sm:min-w-[260px]"
            style={{ animation: "slideUp 0.3s ease-out 240ms both" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600/10 rounded flex items-center justify-center">
                <Icon name="PieChart" size={18} className="text-emerald-700" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[hsl(220,65%,22%)]">Анализ ДДС</div>
                <div className="text-xs text-[hsl(215,16%,48%)]">Доходы и расходы по кварталу</div>
              </div>
              <Icon name="ArrowRight" size={14} className="text-emerald-600 ml-auto" />
            </div>
          </button>
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

      {/* INN Search Modal */}
      {activeSection && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden"
            style={{ animation: "scaleIn 0.2s ease-out both" }}
          >
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
              <button onClick={closeModal} className="text-white/50 hover:text-white transition-colors p-1 rounded">
                <Icon name="X" size={18} />
              </button>
            </div>

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
                  {loading ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Search" size={15} />}
                  Найти
                </button>
              </div>

              {result && (
                <div className="mt-5" style={{ animation: "fadeIn 0.25s ease-out both" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="CheckCircle2" size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Найдено</span>
                  </div>
                  <div className="border border-[hsl(214,20%,86%)] rounded-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[hsl(220,65%,22%)]">
                          <th className="text-left px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-wider w-1/3">Поле</th>
                          <th className="text-left px-4 py-2.5 text-white/80 text-xs font-semibold uppercase tracking-wider">Значение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result).map(([key, value], idx) => (
                          <tr key={key} className={`data-row ${idx % 2 === 1 ? "bg-[hsl(216,28%,98%)]" : "bg-white"}`}>
                            <td className="px-4 py-2.5 border-b border-[hsl(214,20%,86%)] text-[hsl(215,16%,48%)] font-medium text-xs">
                              {key === "Статус" ? <span className="flex items-center gap-1"><Icon name="Tag" size={11} className="text-[hsl(210,80%,50%)]" />{key}</span> : key}
                            </td>
                            <td className="px-4 py-2.5 border-b border-[hsl(214,20%,86%)] text-[hsl(220,40%,10%)]">
                              {key === "Статус" && value ? <StatusBadge value={value} /> : (value || <span className="text-[hsl(215,16%,70%)] italic">—</span>)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    {sent ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3" style={{ animation: "fadeIn 0.25s ease-out both" }}>
                        <Icon name="CheckCircle2" size={15} className="text-emerald-600 shrink-0" />
                        <span className="text-sm text-emerald-700 font-medium">Запрос отправлен в Telegram!</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSendTelegram}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 bg-[hsl(210,80%,50%)] hover:bg-[hsl(210,80%,44%)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
                      >
                        {sending ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
                        Запросить акт сверки
                      </button>
                    )}
                  </div>
                </div>
              )}

              {notFound && (
                <div className="mt-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3" style={{ animation: "fadeIn 0.25s ease-out both" }}>
                  <Icon name="AlertCircle" size={15} className="text-red-500 shrink-0" />
                  <span className="text-sm text-red-700">
                    Контрагент с ИНН <span className="font-mono font-semibold">{query}</span> не найден в таблице.
                  </span>
                </div>
              )}

              {error && (
                <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3" style={{ animation: "fadeIn 0.25s ease-out both" }}>
                  <Icon name="TriangleAlert" size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">{error}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-[hsl(216,28%,97%)] border-t border-[hsl(214,20%,86%)] flex justify-end">
              <button onClick={closeModal} className="text-xs text-[hsl(215,16%,48%)] hover:text-[hsl(220,65%,22%)] transition-colors flex items-center gap-1.5">
                <Icon name="X" size={12} />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DDS Modal */}
      {showDds && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeDds()}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ animation: "scaleIn 0.2s ease-out both" }}
          >
            {/* Header */}
            <div className="bg-[hsl(220,65%,22%)] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded flex items-center justify-center">
                  <Icon name="PieChart" size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Анализ ДДС</h3>
                  <p className="text-white/50 text-xs">Торговый дом + Управление ТД</p>
                </div>
              </div>
              <button onClick={closeDds} className="text-white/50 hover:text-white transition-colors p-1 rounded">
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {/* Info block */}
              {!ddsResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[hsl(216,28%,97%)] rounded-sm p-4 border border-[hsl(214,20%,86%)]">
                      <div className="text-xs text-[hsl(215,16%,48%)] uppercase tracking-wider mb-1">Сегодня</div>
                      <div className="text-sm font-semibold text-[hsl(220,65%,22%)]">{todayStr}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-sm p-4 border border-emerald-200">
                      <div className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Текущий квартал</div>
                      <div className="text-sm font-semibold text-emerald-800">{QUARTER_NAMES[currentQuarter]} {currentYear}</div>
                    </div>
                  </div>

                  <div className="border border-[hsl(214,20%,86%)] border-l-4 border-l-[hsl(215,16%,60%)] bg-[hsl(216,28%,98%)] rounded-sm px-4 py-3 text-xs text-[hsl(215,16%,48%)]">
                    Будут проанализированы только строки, где организация — «торговый дом» или «управление тд».
                  </div>

                  <button
                    onClick={handleAnalyzeDds}
                    disabled={ddsLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-sm text-sm font-semibold transition-colors"
                  >
                    {ddsLoading ? (
                      <>
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        Загружаю данные...
                      </>
                    ) : (
                      <>
                        <Icon name="Play" size={16} />
                        Начать анализ
                      </>
                    )}
                  </button>

                  {ddsError && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                      <Icon name="TriangleAlert" size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">{ddsError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {ddsResult && (
                <div className="space-y-5" style={{ animation: "fadeIn 0.3s ease-out both" }}>
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[hsl(216,28%,97%)] rounded-sm p-3 border border-[hsl(214,20%,86%)]">
                      <div className="text-xs text-[hsl(215,16%,48%)] mb-1">Квартал</div>
                      <div className="text-sm font-semibold text-[hsl(220,65%,22%)]">{QUARTER_NAMES[ddsResult.quarter]} {ddsResult.year}</div>
                    </div>
                    <div className="bg-[hsl(216,28%,97%)] rounded-sm p-3 border border-[hsl(214,20%,86%)]">
                      <div className="text-xs text-[hsl(215,16%,48%)] mb-1">Период</div>
                      <div className="text-xs font-semibold text-[hsl(220,65%,22%)]">{ddsResult.date_start} — {ddsResult.date_end}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-sm p-3 border border-emerald-200">
                      <div className="text-xs text-emerald-600 mb-1">Доходы</div>
                      <div className="text-xs font-semibold text-emerald-800">{formatMoney(ddsResult.total_income)}</div>
                    </div>
                    <div className="bg-red-50 rounded-sm p-3 border border-red-200">
                      <div className="text-xs text-red-500 mb-1">Расходы</div>
                      <div className="text-xs font-semibold text-red-800">{formatMoney(ddsResult.total_expense)}</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="border border-emerald-200 rounded-sm p-4 bg-emerald-50/30">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-semibold text-emerald-800">Доходы</span>
                        <span className="text-xs text-emerald-600 ml-auto">{ddsResult.income_chart.length} кат.</span>
                      </div>
                      <PieChart items={ddsResult.income_chart} total={ddsResult.total_income} />
                    </div>

                    <div className="border border-red-200 rounded-sm p-4 bg-red-50/30">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-sm font-semibold text-red-800">Расходы</span>
                        <span className="text-xs text-red-500 ml-auto">{ddsResult.expense_chart.length} кат.</span>
                      </div>
                      <PieChart items={ddsResult.expense_chart} total={ddsResult.total_expense} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[hsl(215,16%,48%)]">
                    <span>Обработано строк: <strong>{ddsResult.rows_matched}</strong></span>
                    <button
                      onClick={() => setDdsResult(null)}
                      className="text-[hsl(210,80%,50%)] hover:underline flex items-center gap-1"
                    >
                      <Icon name="RefreshCw" size={11} />
                      Обновить
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-[hsl(216,28%,97%)] border-t border-[hsl(214,20%,86%)] flex justify-end shrink-0">
              <button onClick={closeDds} className="text-xs text-[hsl(215,16%,48%)] hover:text-[hsl(220,65%,22%)] transition-colors flex items-center gap-1.5">
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
