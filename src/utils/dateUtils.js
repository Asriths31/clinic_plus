export const CLINIC_TIMEZONE = 'Asia/Kolkata';

// Parse a UTC string to clinic's local date string (YYYY-MM-DD)
export const getLocalDateString = (utcString) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Parse a UTC string to clinic's local time (e.g. "10:30 AM")
export const formatLocalTime = (utcString) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

// Parse a UTC string to clinic's local time 24h format (e.g. "14:30")
export const formatLocalTime24 = (utcString) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return '';
  const str = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
  return str;
};

// Parse a UTC string to clinic's local short date (e.g. "Oct 10, 2026")
export const formatLocalDate = (utcString) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatLocalDateLong = (utcString) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

// Convert frontend form date ("2026-10-10") and time ("10:00") into a UTC ISO String
export const createUTCISOString = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  
  // Format the date assuming it's UTC just to get the timezone offset string from Intl
  const dummyDate = new Date(`${dateStr}T12:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    timeZoneName: 'longOffset' // Returns something like "GMT+05:30"
  });
  
  const formattedParts = formatter.formatToParts(dummyDate);
  const tzPart = formattedParts.find(part => part.type === 'timeZoneName');
  
  let offset = '+05:30'; // fallback
  if (tzPart && tzPart.value) {
    const match = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
    if (match) {
      offset = match[1];
    }
  }
  
  // Construct the ISO string with the timezone offset, e.g. "2026-10-10T10:00:00+05:30"
  // JS Date parses this correctly into a UTC Date object.
  const localIsoWithOffset = `${dateStr}T${timeStr}:00${offset}`;
  const finalDate = new Date(localIsoWithOffset);
  
  if (isNaN(finalDate.getTime())) return '';
  return finalDate.toISOString();
};
