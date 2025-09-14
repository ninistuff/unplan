// lib/errorHandler.ts - Centralized Error Handling
import { useCallback } from 'react';
import { appStore } from './store';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  LOCATION = 'LOCATION',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  GENERATION = 'GENERATION',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Structured error interface
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: number;
  context?: Record<string, any>;
  userMessage: string;
  actionable: boolean;
  retryable: boolean;
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 50;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  // Handle any error and convert to AppError
  handleError(error: any, context?: Record<string, any>): AppError {
    const appError = this.createAppError(error, context);
    
    // Log error
    this.logError(appError);
    
    // Store in history
    this.addToHistory(appError);
    
    // Update global state
    appStore.setError(appError.userMessage);
    
    // Report to analytics (if implemented)
    this.reportError(appError);
    
    return appError;
  }
  
  // Create structured AppError from any error
  private createAppError(error: any, context?: Record<string, any>): AppError {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    // Default values
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let message = 'An unknown error occurred';
    let details = '';
    let userMessage = 'Something went wrong. Please try again.';
    let actionable = true;
    let retryable = true;
    
    // Parse different error types
    if (error instanceof Error) {
      message = error.message;
      details = error.stack || '';
      
      // Network errors
      if (error.name === 'NetworkError' || message.includes('fetch')) {
        type = ErrorType.NETWORK;
        userMessage = 'Network connection problem. Please check your internet connection.';
        severity = ErrorSeverity.HIGH;
      }
      
      // Location errors
      else if (message.includes('location') || message.includes('GPS')) {
        type = ErrorType.LOCATION;
        userMessage = 'Unable to get your location. Please enable location services.';
        severity = ErrorSeverity.HIGH;
      }
      
      // Permission errors
      else if (message.includes('permission') || message.includes('denied')) {
        type = ErrorType.PERMISSION;
        userMessage = 'Permission required. Please grant the necessary permissions.';
        severity = ErrorSeverity.HIGH;
        retryable = false;
      }
      
      // Validation errors
      else if (message.includes('validation') || message.includes('invalid')) {
        type = ErrorType.VALIDATION;
        userMessage = 'Invalid input. Please check your data and try again.';
        severity = ErrorSeverity.LOW;
        retryable = false;
      }
      
      // Generation errors
      else if (message.includes('generate') || message.includes('plan')) {
        type = ErrorType.GENERATION;
        userMessage = 'Unable to generate plans. Please try different parameters.';
        severity = ErrorSeverity.MEDIUM;
      }
    }
    
    // String errors
    else if (typeof error === 'string') {
      message = error;
      userMessage = error;
    }
    
    // HTTP errors
    else if (error && typeof error === 'object' && error.status) {
      type = ErrorType.NETWORK;
      message = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
      
      if (error.status >= 500) {
        userMessage = 'Server error. Please try again later.';
        severity = ErrorSeverity.HIGH;
      } else if (error.status >= 400) {
        userMessage = 'Request error. Please check your input.';
        severity = ErrorSeverity.MEDIUM;
        retryable = false;
      }
    }
    
    return {
      id,
      type,
      severity,
      message,
      details,
      timestamp,
      context,
      userMessage,
      actionable,
      retryable,
    };
  }
  
  // Log error with appropriate level
  private logError(error: AppError): void {
    const logMessage = `[${error.type}] ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL:', logMessage, error);
        break;
      case ErrorSeverity.HIGH:
        console.error('🟠 HIGH:', logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 MEDIUM:', logMessage, error);
        break;
      case ErrorSeverity.LOW:
        console.log('🟢 LOW:', logMessage, error);
        break;
    }
  }
  
  // Add to error history
  private addToHistory(error: AppError): void {
    this.errorHistory.unshift(error);
    
    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }
  
  // Report error to analytics/crash reporting
  private reportError(error: AppError): void {
    // TODO: Implement crash reporting (Crashlytics, Sentry, etc.)
    if (__DEV__) {
      console.log('[ErrorHandler] Would report to analytics:', {
        type: error.type,
        severity: error.severity,
        message: error.message,
        context: error.context,
      });
    }
  }
  
  // Get error history
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }
  
  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
  }
  
  // Get error statistics
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.LOCATION]: 0,
      [ErrorType.PERMISSION]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.GENERATION]: 0,
      [ErrorType.UNKNOWN]: 0,
    };
    
    this.errorHistory.forEach(error => {
      stats[error.type]++;
    });
    
    return stats;
  }
  
  // Check if error is retryable
  isRetryable(error: AppError): boolean {
    return error.retryable && error.severity !== ErrorSeverity.CRITICAL;
  }
  
  // Get user-friendly error message
  getUserMessage(error: any): string {
    if (error && typeof error === 'object' && error.userMessage) {
      return error.userMessage;
    }
    
    const appError = this.createAppError(error);
    return appError.userMessage;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: any, context?: Record<string, any>) =>
  errorHandler.handleError(error, context);

export const getUserErrorMessage = (error: any) =>
  errorHandler.getUserMessage(error);

// React hook for error handling

export function useErrorHandler() {
  const handleError = useCallback((error: any, context?: Record<string, any>) => {
    return errorHandler.handleError(error, context);
  }, []);
  
  const clearError = useCallback(() => {
    appStore.clearError();
  }, []);
  
  return {
    handleError,
    clearError,
    getUserMessage: errorHandler.getUserMessage.bind(errorHandler),
  };
}
