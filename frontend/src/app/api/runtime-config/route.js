import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mqttServer: process.env.NEXT_PUBLIC_MQTT_SERVER || process.env.MQTT_SERVER || "",
  });
}
