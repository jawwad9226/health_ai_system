import { render, screen } from '@testing-library/react';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

test('renders login form', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const loginElement = screen.getByRole('heading', { name: /login/i });
  expect(loginElement).toBeInTheDocument();
});
