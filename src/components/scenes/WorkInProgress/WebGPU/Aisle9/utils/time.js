export default function parseRecordingStartMs(
  recordingStartDate,
  recordingStartTime
) {
  if (
    typeof recordingStartDate !== 'string' ||
    typeof recordingStartTime !== 'string'
  ) {
    return null;
  }

  const dateValue = recordingStartDate.trim();
  const timeValue = recordingStartTime.trim();
  if (!dateValue || !timeValue) return null;

  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const normalizedTime = /^\d{2}:\d{2}$/.test(timeValue)
    ? `${timeValue}:00`
    : timeValue;
  const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!timeMatch) return null;

  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  const parsedMs = new Date(`${dateValue}T${normalizedTime}`).getTime();
  return Number.isNaN(parsedMs) ? null : parsedMs;
}
