function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function getLocalTodayDateValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    padDatePart(today.getMonth() + 1),
    padDatePart(today.getDate()),
  ].join("-");
}

export function formatDueDate(dueDate) {
  if (!dueDate) {
    return "No due date";
  }

  const [
    yearText,
    monthText,
    dayText,
  ] = dueDate.split("-");

  const localDate = new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
  );

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(localDate);
}

export function getDueDateState(
  dueDate,
  isCompleted = false,
) {
  if (!dueDate) {
    return "none";
  }

  if (isCompleted) {
    return "completed";
  }

  const today = getLocalTodayDateValue();

  if (dueDate < today) {
    return "overdue";
  }

  if (dueDate === today) {
    return "today";
  }

  return "upcoming";
}

export function getDueDateLabel(
  dueDate,
  isCompleted = false,
) {
  if (!dueDate) {
    return "No due date";
  }

  const formattedDate = formatDueDate(dueDate);
  const dueDateState = getDueDateState(
    dueDate,
    isCompleted,
  );

  if (dueDateState === "overdue") {
    return `Overdue · ${formattedDate}`;
  }

  if (dueDateState === "today") {
    return `Due today · ${formattedDate}`;
  }

  return `Due ${formattedDate}`;
}