function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isExpired(value) {
  const ts = new Date(value).getTime();

  if (Number.isNaN(ts)) {
    return true;
  }

  return ts <= Date.now();
}

function formatDateAsIsoString(value) {
  const date = new Date(value);
  const ts = date.getTime();

  if (Number.isNaN(ts)) {
    throw new TypeError("Invalid date value provided to formatDateAsIsoString");
  }

  return date.toISOString();
}

module.exports = {
  addDays,
  isExpired,
  formatDateAsIsoString,
};
