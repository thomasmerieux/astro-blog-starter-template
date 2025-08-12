// Global error handling for the application

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorInfo[] = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });
  }

  public logError(errorInfo: ErrorInfo): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorInfo);
    }

    // Add to queue for potential server logging
    this.errorQueue.push(errorInfo);

    // Keep only last 10 errors to prevent memory leaks
    if (this.errorQueue.length > 10) {
      this.errorQueue.shift();
    }

    // In production, you could send to an error tracking service
    // this.sendToErrorService(errorInfo);
  }

  public handleFormError(formElement: HTMLFormElement, error: Error): void {
    const errorContainer = formElement.querySelector('.error-message');
    if (errorContainer) {
      errorContainer.textContent = error.message;
      errorContainer.classList.remove('hidden');
    }

    this.logError({
      message: `Form submission error: ${error.message}`,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  public clearFormError(formElement: HTMLFormElement): void {
    const errorContainer = formElement.querySelector('.error-message');
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.classList.add('hidden');
    }
  }

  // Helper method to show user-friendly error messages
  public showUserError(message: string, container?: HTMLElement): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 rounded-md p-4 mb-4';
    errorDiv.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button type="button" class="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    const targetContainer = container || document.body;
    targetContainer.insertBefore(errorDiv, targetContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  private async sendToErrorService(_errorInfo: ErrorInfo): Promise<void> {
    try {
      // In production, send to error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // });
    } catch (error) {
      // Silently fail to avoid infinite error loops
      console.warn('Failed to send error to tracking service:', error);
    }
  }
}

// Initialize error handler when script loads
export const errorHandler = ErrorHandler.getInstance();