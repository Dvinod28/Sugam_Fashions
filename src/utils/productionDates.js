import { ROLES } from "../data/roles";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateSafe(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function getDaysUntilDelivery(date) {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

export function getReminderDateForRole(deliveryDateValue, role) {
  const deliveryDate = toDateSafe(deliveryDateValue);
  if (!deliveryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveryMidnight = new Date(deliveryDate);
  deliveryMidnight.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((deliveryMidnight.getTime() - today.getTime()) / DAY_MS);

  const offsets =
    role === ROLES.THREAD_WORK
      ? [3, 2, 1]
      : role === ROLES.RD_DEPARTMENT
      ? [2, 1]
      : [1];

  for (const offset of offsets) {
    if (daysUntil >= offset) {
      const reminder = new Date(deliveryMidnight);
      reminder.setDate(reminder.getDate() - offset);
      reminder.setHours(0, 0, 0, 0);
      if (reminder < today) {
        return today;
      }
      return reminder;
    }
  }

  if (daysUntil > 0) {
    return today;
  }

  return deliveryMidnight > today ? deliveryMidnight : today;
}


