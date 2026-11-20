import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

describe('Design System Primitives (Stage 1)', () => {
  it('renders Button with variants and handles loading state', () => {
    const { rerender } = render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();

    rerender(<Button isLoading>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders Badge with custom variants', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Card surface cleanly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});
