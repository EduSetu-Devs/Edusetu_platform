import { render, screen } from '@testing-library/react';
import RoleCard from '../components/RoleCard';

describe('RoleCard', () => {
  it('renders role titles', () => {
    render(<RoleCard />);
    expect(screen.getByRole('heading', { name: /Students/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Teachers/i })).toBeInTheDocument();
  });
});