export type ConsultSlot = {
  endsAt: string;
  label: string;
  startsAt: string;
};

const easternTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

function nextWeekday(date: Date) {
  const candidate = new Date(date);

  while (candidate.getDay() === 0 || candidate.getDay() === 6) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function sessionEndsAt(startsAt: string) {
  return addMinutes(new Date(startsAt), 30).toISOString();
}

export function buildConsultSlots(now = new Date()): ConsultSlot[] {
  const slots: ConsultSlot[] = [];
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() + 1);

  while (slots.length < 9) {
    const day = nextWeekday(cursor);

    for (const hour of [10, 14, 18]) {
      if (slots.length >= 9) {
        break;
      }

      const startsAt = new Date(day);
      startsAt.setHours(hour, 0, 0, 0);

      if (startsAt.getTime() <= now.getTime()) {
        continue;
      }

      slots.push({
        endsAt: sessionEndsAt(startsAt.toISOString()),
        label: easternTimeFormatter.format(startsAt),
        startsAt: startsAt.toISOString(),
      });
    }

    cursor.setDate(day.getDate() + 1);
  }

  return slots;
}
