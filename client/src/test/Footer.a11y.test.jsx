import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/dist/matchers.js';
import { expect } from 'vitest';
import Footer from '../components/Footer';

expect.extend({ toHaveNoViolations });

describe('Footer accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});