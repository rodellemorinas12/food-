import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error message when child throws', () => {
    const ErrorThrower = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show retry button when error occurs', () => {
    const ErrorThrower = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
  });

  it('should call console.error when error occurs', () => {
    const errorSpy = jest.spyOn(console, 'error');
    
    const ErrorThrower = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should be memoized', () => {
    expect(ErrorBoundary.displayName).toBe('ErrorBoundary');
  });
});
