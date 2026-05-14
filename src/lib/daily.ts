import crypto from "node:crypto";

export type DailyRoomRequest = {
  sessionId: string;
  startsAt: string;
  expiresAt: string;
};

export function createSafeDailyRoomName(sessionId: string) {
  const random = crypto.randomBytes(12).toString("hex");
  const sessionHash = crypto.createHash("sha256").update(sessionId).digest("hex").slice(0, 10);
  return `cardigan-${sessionHash}-${random}`;
}

export async function createDailyRoom(input: DailyRoomRequest) {
  const name = createSafeDailyRoomName(input.sessionId);
  const apiKey = process.env.DAILY_API_KEY;
  const domain = process.env.DAILY_DOMAIN;

  if (!apiKey || !domain) {
    return {
      configured: false,
      roomName: name,
      roomUrl: `https://daily.example/${name}`,
    };
  }

  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        enable_recording: "off",
        exp: Math.floor(new Date(input.expiresAt).getTime() / 1000),
        nbf: Math.floor(new Date(input.startsAt).getTime() / 1000) - 900,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Daily room creation failed with ${response.status}`);
  }

  const payload = (await response.json()) as { name: string; url: string };

  return {
    configured: true,
    roomName: payload.name,
    roomUrl: payload.url,
  };
}
