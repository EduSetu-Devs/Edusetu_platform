import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer', () => {
  it('renders the EduSetu brand', () => {
    render(<Footer />);
    expect(screen.getByText(/EduSetu/i)).toBeInTheDocument();
  });
});