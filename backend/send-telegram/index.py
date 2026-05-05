import os
import json
import urllib.request
import urllib.error


def get_chat_id(token: str) -> str | None:
    """Получить chat_id последнего написавшего пользователя через getUpdates"""
    url = f"https://api.telegram.org/bot{token}/getUpdates?limit=1&offset=-1"
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())
    results = data.get("result", [])
    if results:
        msg = results[-1].get("message") or results[-1].get("channel_post")
        if msg:
            return str(msg["chat"]["id"])
    return None


def handler(event: dict, context) -> dict:
    """Отправка запроса акта сверки в Telegram с данными найденного контрагента."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        data = body.get("data", {})
        inn = body.get("inn", "")

        if not data:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "Нет данных для отправки"}, ensure_ascii=False),
            }

        token = os.environ["TELEGRAM_BOT_TOKEN"]

        chat_id = get_chat_id(token)
        if not chat_id:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps(
                    {"error": "Не удалось определить получателя. Напишите боту @DOCSBOSSBOT любое сообщение и попробуйте снова."},
                    ensure_ascii=False,
                ),
            }

        lines = ["📋 *Запрос акта сверки*", ""]
        for key, value in data.items():
            if value:
                lines.append(f"*{key}:* {value}")
        lines.append("")
        lines.append("_Просьба прислать акт сверки_")

        text = "\n".join(lines)

        send_url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = json.dumps({
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
        }).encode("utf-8")

        req = urllib.request.Request(
            send_url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())

        if result.get("ok"):
            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({"success": True}, ensure_ascii=False),
            }
        else:
            return {
                "statusCode": 500,
                "headers": cors_headers,
                "body": json.dumps({"error": result.get("description", "Ошибка Telegram")}, ensure_ascii=False),
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }
