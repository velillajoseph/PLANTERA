import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackForm from '../app/components/FeedbackForm';

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders inputs and handles submission', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test', message: 'Hello', created_at: new Date().toISOString() })
    } as Response);

    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Testing' } });
    fireEvent.click(screen.getByRole('button', { name: /send feedback/i }));

    await waitFor(() => screen.getByText(/thanks for your feedback/i));
    expect(screen.getByText(/thanks for your feedback/i)).toBeInTheDocument();
  });
});
