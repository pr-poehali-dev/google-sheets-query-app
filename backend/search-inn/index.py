import os
import json
import urllib.request
import urllib.parse
import urllib.error

SPREADSHEET_ID = "1GTsoaUlmkPOjjFRTzQpVjFLXvlGdxt93ewau0A5ns7Q"
SHEET_GID = "791026469"
RANGE = "A:Z"


def google_get(url: str) -> dict:
    """GET-запрос к Google API с читаемой ошибкой при неудаче"""
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


def handler(event: dict, context) -> dict:
    """Поиск контрагента по ИНН в Google Таблице. Ищет по столбцу B, возвращает всю строку."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        inn = str(body.get("inn", "")).strip()

        if not inn:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "ИНН не указан"}, ensure_ascii=False),
            }

        api_key = os.environ["GOOGLE_SHEETS_API_KEY"]

        sheet_name = get_sheet_name(api_key, SHEET_GID)

        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}"
            f"/values/{urllib.parse.quote(sheet_name)}!{RANGE}?key={api_key}"
        )

        data = google_get(url)

        rows = data.get("values", [])

        if not rows:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"found": False, "message": "Таблица пуста"}, ensure_ascii=False),
            }

        headers = rows[0] if rows else []

        for row in rows[1:]:
            inn_cell = row[1].strip() if len(row) > 1 else ""
            if inn_cell == inn:
                result = {}
                for i, header in enumerate(headers):
                    result[header] = row[i] if i < len(row) else ""
                return {
                    "statusCode": 200,
                    "headers": cors_headers,
                    "body": json.dumps({"found": True, "data": result}, ensure_ascii=False),
                }

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"found": False}, ensure_ascii=False),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }