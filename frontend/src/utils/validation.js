/**
 * Regular Expression Validation Utilities for HealthPortal
 * Provides rigorous validation rules matching the Spring Boot backend validation patterns.
 */

export const REGEX = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/,
  PHONE: /^[6-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/,
  DATE_ISO: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  TIME_HHMM: /^([01]\d|2[0-3]):[0-5]\d$/
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  if (!REGEX.EMAIL.test(email.trim())) {
    return 'Enter a valid email address (e.g. user@example.com)';
  }
  return '';
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return 'Phone number is required';
  if (!REGEX.PHONE.test(phone.trim())) {
    return 'Phone number must be a 10-digit number starting with 6, 7, 8, or 9';
  }
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8 || password.length > 32) {
    return 'Password must be between 8 and 32 characters';
  }
  if (!REGEX.PASSWORD.test(password)) {
    return 'Password must have at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@$!%*?&)';
  }
  return '';
};

export const validateChiefComplaint = (complaint) => {
  if (!complaint || !complaint.trim()) return 'Chief complaint is required';
  if (complaint.trim().length < 3) return 'Please describe complaint with at least 3 characters';
  if (complaint.trim().length > 255) return 'Complaint must be under 255 characters';
  return '';
};

export const validateSymptoms = (symptoms) => {
  if (!symptoms || !symptoms.trim()) return 'Detailed symptom description is required';
  if (symptoms.trim().length < 10) return 'Please provide more detail (at least 10 characters)';
  return '';
};

