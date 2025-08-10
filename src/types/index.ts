import type { Languages, ui, defaultLang } from '../i18n/ui';

/**
 * Translation function type for i18n - matches the actual implementation
 */
export type TranslationFunction = (key: keyof typeof ui[typeof defaultLang]) => string;

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  lang?: Languages;
  t: TranslationFunction;
}

/**
 * Page component props interface
 */
export interface PageComponentProps extends BaseComponentProps {
  title?: string;
}

/**
 * Menu component props interface
 */
export interface MenuProps extends BaseComponentProps {}

/**
 * Page wrapper component props interface
 */
export interface PageWrapperProps {
  title?: string;
  lang?: Languages;
  t: TranslationFunction;
}

/**
 * RSVP form data interface
 */
export interface RSVPFormData {
  firstName: string;
  lastName: string;
  email: string;
  attendance: 'yes' | 'no';
  vegetarian: boolean;
  plusOne: boolean;
  plusOneFirstName?: string;
  plusOneLastName?: string;
  plusOneVegetarian?: boolean;
  message?: string;
}

/**
 * Form validation errors interface
 */
export interface FormValidationErrors {
  [key: string]: string | undefined;
}

/**
 * Language selector option interface
 */
export interface LanguageOption {
  value: Languages;
  label: string;
  selected: boolean;
}

/**
 * Hotel information interface
 */
export interface HotelInfo {
  name: string;
  description: string;
  price?: string;
  location: string;
  websiteUrl?: string;
  images: string[];
}

/**
 * Schedule event interface
 */
export interface ScheduleEvent {
  id: string;
  fullDate: string;
  time: string;
  title: string;
  description: string;
}

/**
 * Q&A item interface
 */
export interface QAItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Venue feature interface
 */
export interface VenueFeature {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Type guards and validation utilities
 */
export const TypeGuards = {
  /**
   * Validates if a value is a valid language
   */
  isValidLanguage(value: unknown): value is Languages {
    return typeof value === 'string' && ['en', 'fr', 'ro'].includes(value);
  },

  /**
   * Validates if a value is a translation function
   */
  isTranslationFunction(value: unknown): value is TranslationFunction {
    return typeof value === 'function';
  },

  /**
   * Validates component props
   */
  validateBaseComponentProps(props: unknown): props is BaseComponentProps {
    if (!props || typeof props !== 'object') return false;
    
    const p = props as Record<string, unknown>;
    
    // lang is optional but must be valid if provided
    if (p.lang !== undefined && !this.isValidLanguage(p.lang)) {
      console.error('Invalid language provided:', p.lang);
      return false;
    }

    // t is required and must be a function
    if (!this.isTranslationFunction(p.t)) {
      console.error('Translation function is required and must be a function');
      return false;
    }

    return true;
  },

  /**
   * Validates RSVP form data
   */
  validateRSVPFormData(data: unknown): data is Partial<RSVPFormData> {
    if (!data || typeof data !== 'object') return false;
    
    const formData = data as Record<string, unknown>;
    
    // Basic validation - extend as needed
    if (formData.email && typeof formData.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        console.error('Invalid email format');
        return false;
      }
    }
    
    if (formData.attendance && !['yes', 'no'].includes(formData.attendance as string)) {
      console.error('Invalid attendance value');
      return false;
    }

    return true;
  }
};