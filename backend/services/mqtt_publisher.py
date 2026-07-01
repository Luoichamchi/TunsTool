import json
from typing import Any, Dict, Optional

from config.settings import settings

try:
    import paho.mqtt.publish as mqtt_publish
except Exception:  # pragma: no cover - dependency may be missing in dev until synced
    mqtt_publish = None


def _normalize_mqtt_host(mqtt_server: str) -> tuple[str, int]:
    value = (mqtt_server or "").strip()
    if not value:
        return "", 1883

    if "://" in value:
        value = value.split("://", 1)[1]
    value = value.split("/", 1)[0]
    if ":" in value:
        host, port = value.split(":", 1)
        try:
            return host, int(port)
        except ValueError:
            return host, 1883
    return value, 1883


def publish_order_event(tenant_code: str, payload: Dict[str, Any], mqtt_server: Optional[str] = None) -> None:
    server = mqtt_server or settings.MQTT_SERVER
    if not server or mqtt_publish is None:
        return

    host, port = _normalize_mqtt_host(server)
    if not host:
        return

    mqtt_publish.single(
        topic=f"TunsTool/{tenant_code}/orders",
        payload=json.dumps(payload, default=str),
        hostname=host,
        port=port,
    )
