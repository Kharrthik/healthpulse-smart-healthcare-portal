/**
 * Formatting Utilities for HealthPortal
 */

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'Not scheduled';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return dateString;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return dateString;
  }
};

export const getTriageBadgeClass = (triage) => {
  switch (triage?.toUpperCase()) {
    case 'EMERGENCY':
      return 'badge-emergency';
    case 'URGENT':
      return 'badge-urgent';
    case 'ROUTINE':
    default:
      return 'badge-routine';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'badge-confirmed';
    case 'COMPLETED':
      return 'badge-completed';
    case 'CANCELLED':
      return 'badge-cancelled';
    case 'PENDING':
    default:
      return 'badge-pending';
  }
};

