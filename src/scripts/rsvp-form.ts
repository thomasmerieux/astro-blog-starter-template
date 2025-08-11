/**
 * RSVP Form Handler
 * Manages form validation, submission, and plus-one functionality
 */

export interface TranslationFunction {
  (key: string): string;
}

export interface RSVPFormElements {
  form: HTMLFormElement;
  submitButton: HTMLButtonElement;
  submitText: HTMLElement;
  submitLoading: HTMLElement;
  submitStatus: HTMLElement;
  plusOneCheckbox: HTMLInputElement;
  plusOneFields: HTMLElement;
  guestFirstName: HTMLInputElement;
  guestLastName: HTMLInputElement;
}

export class RSVPFormHandler {
  private isInitialized = false;
  private elements: RSVPFormElements | null = null;
  private t: TranslationFunction;

  constructor(translationFunction: TranslationFunction) {
    this.t = translationFunction;
  }

  /**
   * Initialize the RSVP form with event listeners and validation
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    const elements = this.getFormElements();
    if (!elements) {
      return;
    }

    this.elements = elements;
    this.setupPlusOneToggle();
    this.setupFormSubmission();
    this.isInitialized = true;
  }

  /**
   * Get all required form elements
   */
  private getFormElements(): RSVPFormElements | null {
    const form = document.getElementById('rsvp-form') as HTMLFormElement;
    const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
    const submitText = document.getElementById('submit-text') as HTMLElement;
    const submitLoading = document.getElementById('submit-loading') as HTMLElement;
    const submitStatus = document.getElementById('submit-status') as HTMLElement;
    const plusOneCheckbox = document.getElementById('plusOneCheckbox') as HTMLInputElement;
    const plusOneFields = document.getElementById('plusOneFields') as HTMLElement;
    const guestFirstName = document.querySelector(
      'input[name="guestFirstName"]'
    ) as HTMLInputElement;
    const guestLastName = document.querySelector('input[name="guestLastName"]') as HTMLInputElement;

    if (!form || !submitButton || !submitText || !submitLoading || !submitStatus) {
      return null;
    }

    return {
      form,
      submitButton,
      submitText,
      submitLoading,
      submitStatus,
      plusOneCheckbox,
      plusOneFields,
      guestFirstName,
      guestLastName,
    };
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Show error message for a specific field
   */
  private showFieldError(fieldName: string, message: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');

      // Add aria-invalid to the field
      const field =
        document.getElementById(fieldName) ||
        (document.querySelector(`input[name="${fieldName}"]`) as HTMLElement);
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('border-red-500');
      }
    }
  }

  /**
   * Clear error message for a specific field
   */
  private clearFieldError(fieldName: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');

      // Remove aria-invalid from the field
      const field =
        document.getElementById(fieldName) ||
        (document.querySelector(`input[name="${fieldName}"]`) as HTMLElement);
      if (field) {
        field.removeAttribute('aria-invalid');
        field.classList.remove('border-red-500');
      }
    }
  }

  /**
   * Clear all error messages
   */
  private clearAllErrors(): void {
    const errorElements = document.querySelectorAll('[id$="-error"]');
    errorElements.forEach((element) => {
      element.textContent = '';
      element.classList.add('hidden');
    });

    const invalidFields = document.querySelectorAll('[aria-invalid="true"]');
    invalidFields.forEach((field) => {
      field.removeAttribute('aria-invalid');
      field.classList.remove('border-red-500');
    });
  }

  /**
   * Show general error message
   */
  private showErrorMessage(message: string): void {
    if (!this.elements) return;

    // Remove existing error
    const existingError = document.getElementById('general-error');
    if (existingError) {
      existingError.remove();
    }

    // Create new error div
    const errorDiv = document.createElement('div');
    errorDiv.id = 'general-error';
    errorDiv.className = 'mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800';
    errorDiv.textContent = message;

    this.elements.form.appendChild(errorDiv);
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Setup plus-one checkbox toggle functionality
   */
  private setupPlusOneToggle(): void {
    if (!this.elements || !this.elements.plusOneCheckbox || !this.elements.plusOneFields) {
      return;
    }

    this.elements.plusOneCheckbox.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.handlePlusOneToggle(target.checked);
    });
  }

  /**
   * Handle plus-one checkbox toggle
   */
  private handlePlusOneToggle(isChecked: boolean): void {
    if (!this.elements) return;

    const { plusOneFields, guestFirstName, guestLastName } = this.elements;

    if (isChecked) {
      plusOneFields.classList.remove('hidden');
      plusOneFields.setAttribute('aria-hidden', 'false');

      // Make guest name fields required when shown
      if (guestFirstName) {
        guestFirstName.required = true;
        guestFirstName.setAttribute('aria-required', 'true');
      }
      if (guestLastName) {
        guestLastName.required = true;
        guestLastName.setAttribute('aria-required', 'true');
      }

      // Focus first guest field
      setTimeout(() => guestFirstName?.focus(), 100);
    } else {
      plusOneFields.classList.add('hidden');
      plusOneFields.setAttribute('aria-hidden', 'true');

      // Remove required attribute when hidden and clear values
      if (guestFirstName) {
        guestFirstName.required = false;
        guestFirstName.removeAttribute('aria-required');
        guestFirstName.value = '';
        this.clearFieldError('guestFirstName');
      }
      if (guestLastName) {
        guestLastName.required = false;
        guestLastName.removeAttribute('aria-required');
        guestLastName.value = '';
        this.clearFieldError('guestLastName');
      }

      // Clear vegetarian checkbox for +1
      const plusOneVegetarian = document.querySelector(
        'input[name="plusOneVegetarian"]'
      ) as HTMLInputElement;
      if (plusOneVegetarian) {
        plusOneVegetarian.checked = false;
      }
    }
  }

  /**
   * Setup form submission handling
   */
  private setupFormSubmission(): void {
    if (!this.elements) return;

    this.elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleFormSubmission();
    });
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(): Promise<void> {
    if (!this.elements) return;

    // Clear previous errors
    this.clearAllErrors();
    const existingError = document.getElementById('general-error');
    if (existingError) {
      existingError.remove();
    }

    // Validate form
    const formData = new FormData(this.elements.form);
    if (!this.validateForm(formData)) {
      // Focus first error field
      const firstErrorField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }

    // Show loading state
    this.setLoadingState(true);

    try {
      const response = await this.submitForm(formData);
      await this.handleResponse(response);
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Validate form data
   */
  private validateForm(formData: FormData): boolean {
    let hasErrors = false;

    // Validate required fields
    if (!formData.get('firstName')?.toString().trim()) {
      this.showFieldError('firstName', this.t('rsvp.errors.firstNameRequired'));
      hasErrors = true;
    }

    if (!formData.get('lastName')?.toString().trim()) {
      this.showFieldError('lastName', this.t('rsvp.errors.lastNameRequired'));
      hasErrors = true;
    }

    const email = formData.get('email')?.toString().trim();
    if (!email) {
      this.showFieldError('email', this.t('rsvp.errors.emailRequired'));
      hasErrors = true;
    } else if (!this.validateEmail(email)) {
      this.showFieldError('email', this.t('rsvp.errors.emailInvalid'));
      hasErrors = true;
    }

    if (!formData.get('attendance')) {
      this.showFieldError('attendance', this.t('rsvp.errors.attendanceRequired'));
      hasErrors = true;
    }

    // Validate guest fields if plus one is checked
    if (formData.get('plusOne') === 'on') {
      if (!formData.get('guestFirstName')?.toString().trim()) {
        this.showFieldError('guestFirstName', this.t('rsvp.errors.guestFirstNameRequired'));
        hasErrors = true;
      }
      if (!formData.get('guestLastName')?.toString().trim()) {
        this.showFieldError('guestLastName', this.t('rsvp.errors.guestLastNameRequired'));
        hasErrors = true;
      }
    }

    return !hasErrors;
  }

  /**
   * Submit form data
   */
  private async submitForm(formData: FormData): Promise<Response> {
    return fetch('/api/rsvp', {
      method: 'POST',
      body: formData,
      redirect: 'manual', // Handle redirects manually
    });
  }

  /**
   * Handle form submission response
   */
  private async handleResponse(response: Response): Promise<void> {
    // Check if response is a redirect
    if (response.type === 'opaqueredirect' || response.status === 302) {
      this.redirectToThankYou();
      return;
    }

    if (response.ok) {
      try {
        const result = await response.json();
        if (result.success) {
          this.redirectToThankYou();
        } else {
          this.handleErrorResponse(result);
        }
      } catch {
        // If JSON parsing fails but response is ok, assume success
        this.redirectToThankYou();
      }
    } else {
      try {
        const result = await response.json();
        this.handleErrorResponse(result);
      } catch {
        this.showErrorMessage(this.t('rsvp.errors.unexpected'));
        if (this.elements) {
          this.elements.submitStatus.textContent = this.t('rsvp.errors.submissionError');
        }
      }
    }
  }

  /**
   * Handle submission errors
   */
  private handleSubmissionError(_error: unknown): void {
    this.showErrorMessage(this.t('rsvp.errors.networkError'));
    if (this.elements) {
      this.elements.submitStatus.textContent = this.t('rsvp.errors.networkErrorStatus');
    }
  }

  /**
   * Handle error response from server
   */
  private handleErrorResponse(result: Record<string, unknown>): void {
    if (result.errors) {
      // Show field-specific errors
      for (const [field, error] of Object.entries(result.errors)) {
        this.showFieldError(field, error as string);
      }
    } else {
      this.showErrorMessage(result.error || this.t('rsvp.errors.unexpected'));
    }

    if (this.elements) {
      this.elements.submitStatus.textContent = this.t('rsvp.errors.submissionError');
    }
  }

  /**
   * Set loading state for form submission
   */
  private setLoadingState(isLoading: boolean): void {
    if (!this.elements) return;

    const { submitButton, submitText, submitLoading, submitStatus } = this.elements;

    submitButton.disabled = isLoading;

    if (isLoading) {
      submitText.classList.add('hidden');
      submitLoading.classList.remove('hidden');
      submitStatus.textContent = this.t('rsvp.form.statusSubmitting');
    } else {
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  }

  /**
   * Redirect to thank you page with language support
   */
  private redirectToThankYou(): void {
    const pathLang = window.location.pathname.split('/')[1];
    const currentLang = ['en', 'fr', 'ro'].includes(pathLang) ? pathLang : 'en';
    const thankYouUrl = currentLang === 'en' ? '/thank-you' : `/${currentLang}/thank-you`;

    window.location.href = thankYouUrl;
  }
}

/**
 * Initialize RSVP form handler
 */
export function initializeRSVPForm(translationFunction: TranslationFunction): void {
  const formHandler = new RSVPFormHandler(translationFunction);

  // Initialize on both DOMContentLoaded and ViewTransitions
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => formHandler.initialize());
  } else {
    formHandler.initialize();
  }

  // Support for Astro view transitions
  document.addEventListener('astro:page-load', () => formHandler.initialize());
}
