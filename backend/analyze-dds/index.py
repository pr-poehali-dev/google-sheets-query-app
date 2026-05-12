import os
import json
import urllib.request
import urllib.parse
import urllib.error
from datetime import date, datetime

SPREADSHEET_ID = "1YYpkD_mI4UPW-3o7wTqozoPJpvmKyhebCJFjF_AERIs"
SHEET_GID = "0"

TARGET_ORGS = ["торговый дом", "управление тд"]


def google_get(url: str) -> dict:
    """GET-запрос к Google Sheets API"""
    try:
        with urllib.request.urlopen(url) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(error_body).get("error", {}).get("message", error_body)
        except Exception:
            detail = error_body
        raise RuntimeError(f"Google API error {e.code}: {detail}")


def get_sheet_name(api_key: str, gid: str) -> str:
    """Получить название листа по gid"""
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?key={api_key}&fields=sheets.properties"
    data = google_get(url)
    for sheet in data.get("sheets", []):
        props = sheet.get("properties", {})
        if str(props.get("sheetId")) == gid:
            return props.get("title", "Sheet1")
    return "Sheet1"


def get_quarter_dates(quarter: int, year: int):
    """Вернуть даты начала и конца квартала"""
    starts = {1: (1, 1), 2: (4, 1), 3: (7, 1), 4: (10, 1)}
    ends = {1: (3, 31), 2: (6, 30), 3: (9, 30), 4: (12, 31)}
    m_start, d_start = starts[quarter]
    m_end, d_end = ends[quarter]
    return date(year, m_start, d_start), date(year, m_end, d_end)


def parse_amount(val: str) -> float:
    """Парсинг суммы: '122 966,00' или '-1 500,00'"""
    val = val.strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
    try:
        return float(val)
    except ValueError:
        return 0.0


def parse_date(val: str):
    """Парсинг даты формата DD.MM.YYYY"""
    val = val.strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


def categorize_payment(purpose: str) -> str:
    """Определить категорию по назначению платежа"""
    p = purpose.lower()
    if any(w in p for w in ["товар", "продукт", "поставк"]):
        return "Товары"
    if any(w in p for w in ["строймат", "строительные материалы", "материал"]):
        return "Стройматериалы"
    if any(w in p for w in ["смр", "строительно-монтаж", "монтаж", "ремонт", "строительные работы"]):
        return "СМР"
    if any(w in p for w in ["зарплат", "заработная плата", "вознаграждени", "зп"]):
        return "Зарплата"
    if any(w in p for w in ["аренда", "субаренда"]):
        return "Аренда"
    if any(w in p for w in ["банк", "комиссия", "обслуживани"]):
        return "Банковские услуги"
    if any(w in p for w in ["налог", "ндс", "ндфл", "пенсион", "страхов"]):
        return "Налоги/взносы"
    if any(w in p for w in ["транспорт", "доставк", "перевозк", "логистик"]):
        return "Транспорт"
    if any(w in p for w in ["услуг", "сервис", "обслуживан"]):
        return "Услуги"
    return "Прочее"


def handler(event: dict, context) -> dict:
    """Анализ листа ДДС за текущий квартал. Возвращает диаграммы доходов и расходов по назначениям платежей."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    quarter = int(body.get("quarter", 1))
    year = int(body.get("year", date.today().year))

    date_start, date_end = get_quarter_dates(quarter, year)

    api_key = os.environ["GOOGLE_SHEETS_API_KEY"]
    sheet_name = get_sheet_name(api_key, SHEET_GID)

    url = (
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}"
        f"/values/{urllib.parse.quote(sheet_name)}!A:G?key={api_key}"
    )
    data = google_get(url)
    rows = data.get("values", [])

    income_by_cat = {}
    expense_by_cat = {}
    total_income = 0.0
    total_expense = 0.0
    rows_matched = 0

    for row in rows:
        if len(row) < 5:
            continue

        date_val = parse_date(row[0]) if row[0] else None
        if date_val is None:
            continue
        if not (date_start <= date_val <= date_end):
            continue

        org = row[4].strip().lower() if len(row) > 4 else ""
        if not any(t in org for t in TARGET_ORGS):
            continue

        amount = parse_amount(row[1]) if len(row) > 1 else 0.0
        purpose = row[6] if len(row) > 6 else (row[2] if len(row) > 2 else "")
        category = categorize_payment(purpose)

        rows_matched += 1

        if amount > 0:
            income_by_cat[category] = income_by_cat.get(category, 0.0) + amount
            total_income += amount
        elif amount < 0:
            cat_key = category
            expense_by_cat[cat_key] = expense_by_cat.get(cat_key, 0.0) + abs(amount)
            total_expense += abs(amount)

    def build_chart(by_cat: dict, total: float):
        items = []
        for cat, val in sorted(by_cat.items(), key=lambda x: -x[1]):
            pct = round(val / total * 100, 1) if total > 0 else 0
            items.append({"category": cat, "amount": round(val, 2), "percent": pct})
        return items

    result = {
        "quarter": quarter,
        "year": year,
        "date_start": date_start.strftime("%d.%m.%Y"),
        "date_end": date_end.strftime("%d.%m.%Y"),
        "rows_matched": rows_matched,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "income_chart": build_chart(income_by_cat, total_income),
        "expense_chart": build_chart(expense_by_cat, total_expense),
    }

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps(result, ensure_ascii=False),
    }
