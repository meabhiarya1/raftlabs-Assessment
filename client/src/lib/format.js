export function formatCurrency(cents) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(cents / 100);
}

export function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function titleCaseStatus(status) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage
  );
}

export function getValidationFieldErrors(error) {
  return error?.response?.data?.error?.details?.fieldErrors || {};
}
