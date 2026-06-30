export async function GET() {
  return Response.json({
    mqttServer: process.env.MQTT_SERVER || "",
  });
}
