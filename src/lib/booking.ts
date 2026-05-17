const simplePracticeBookingUrl = process.env.NEXT_PUBLIC_SIMPLEPRACTICE_BOOKING_URL?.trim();

export const clinicalBooking = {
  href: simplePracticeBookingUrl || "/start",
  isSimplePracticeEnabled: Boolean(simplePracticeBookingUrl),
  label: simplePracticeBookingUrl ? "Book secure consult" : "Start consult request",
  shortLabel: simplePracticeBookingUrl ? "Book consult" : "Begin",
};
