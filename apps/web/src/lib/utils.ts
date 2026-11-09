import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export interface FormattedCustomization {
  label: string;
  value: string;
}

export function parseCustomizations(optionsJson: string | null | undefined): FormattedCustomization[] {
  if (!optionsJson) return [];
  try {
    const parsed = typeof optionsJson === 'string' ? JSON.parse(optionsJson) : optionsJson;
    if (typeof parsed !== 'object' || parsed === null) return [];
    return Object.entries(parsed).map(([key, val]) => ({
      label: key,
      value: String(val),
    }));
  } catch {
    return [];
  }
}

export function formatCustomizationsInline(optionsJson: string | null | undefined): string {
  const items = parseCustomizations(optionsJson);
  if (items.length === 0) return '';
  return items.map((i) => `${i.label}: ${i.value}`).join(' • ');
}

