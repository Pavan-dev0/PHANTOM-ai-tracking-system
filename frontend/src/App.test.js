import { act, fireEvent, render, screen } from '@testing-library/react';

const mockCreateCaseReport = jest.fn(() => ({
  save: jest.fn(),
}));

jest.mock('./report', () => ({
  createCaseReport: (...args) => mockCreateCaseReport(...args),
}));

const App = require('./App').default;

test('runs the locate analysis flow with status, maps, and export actions', async () => {
  jest.useFakeTimers();
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /new analysis/i }));
  fireEvent.click(screen.getByRole('button', { name: /case 1/i }));
  fireEvent.change(screen.getByLabelText(/person name/i), {
    target: { value: 'Ravi Kumar' },
  });
  fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

  expect(screen.getByText('CASE SUBMITTED').closest('.analysis-status-step')).toHaveClass('is-active');
  expect(screen.getByText('ANALYSING').closest('.analysis-status-step')).not.toHaveClass('is-active');
  expect(screen.getByText('RESULT READY').closest('.analysis-status-step')).not.toHaveClass('is-active');

  await act(async () => {
    jest.advanceTimersByTime(600);
  });

  expect(screen.getByText('ANALYSING').closest('.analysis-status-step')).toHaveClass('is-active');
  expect(screen.getByText('ANALYSING').closest('.analysis-status-step')).toHaveClass('is-blinking');

  await act(async () => {
    jest.advanceTimersByTime(900);
  });

  await act(async () => {
    await Promise.resolve();
  });

  await act(async () => {
    jest.advanceTimersByTime(20);
  });

  expect(screen.getByText('RESULT READY').closest('.analysis-status-step')).toHaveClass('is-active');
  expect(screen.getByText('ANALYSING').closest('.analysis-status-step')).not.toHaveClass('is-blinking');
  expect(screen.getByText('PHT-2024-001').closest('.analysis-result-card')).toHaveClass('is-visible');

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  expect(screen.getByText('WRAITH')).toHaveClass('is-badge-visible');

  fireEvent.click(screen.getByRole('button', { name: /open search zone/i }));
  expect(openSpy).toHaveBeenCalledWith(
    'https://www.google.com/maps/@13.0827,80.2707,13z',
    '_blank',
    'noopener,noreferrer'
  );

  fireEvent.click(screen.getByRole('button', { name: /export report/i }));
  expect(
    mockCreateCaseReport.mock.calls.some(([payload]) => payload.subjectName === 'Ravi Kumar')
  ).toBe(true);
  expect(
    mockCreateCaseReport.mock.calls.some(([payload]) => payload.result.case_id === 'PHT-2024-001')
  ).toBe(true);
  expect(
    mockCreateCaseReport.mock.calls.some(([payload]) =>
      payload.mapsUrl === 'https://www.google.com/maps/@13.0827,80.2707,13z'
    )
  ).toBe(true);

  openSpy.mockRestore();
  jest.useRealTimers();
});

test('shows renamed navigation, sidebar branding, and live overview shell', () => {
  jest.useFakeTimers();
  render(<App />);

  expect(screen.getByText('PHANTOM-WRAITH')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'CASE OVERVIEW' })).toBeInTheDocument();
  expect(screen.getByText('PHANTOM-WRAITH ACTIVE')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CASE OVERVIEW' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'NEW ANALYSIS' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ACTIVE CASES' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'INVESTIGATOR PROFILE' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'SYSTEM SETTINGS' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ABOUT PHANTOM-WRAITH' })).toBeInTheDocument();
  expect(screen.getByText('0%')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('76%')).toBeInTheDocument();
  jest.useRealTimers();
});

test('fills all preset cases and produces green amber and red analysis states', async () => {
  jest.useFakeTimers();
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'NEW ANALYSIS' }));

  const case1Button = screen.getByRole('button', { name: /case 1/i });
  const case2Button = screen.getByRole('button', { name: /case 2/i });
  const case3Button = screen.getByRole('button', { name: /case 3/i });
  const personNameInput = screen.getByLabelText(/person name/i);
  const notesInput = screen.getByLabelText(/phone activity notes/i);
  const transportSelect = screen.getByLabelText(/transport available/i);

  fireEvent.click(case1Button);
  expect(personNameInput).toHaveValue('Ravi Kumar');
  expect(notesInput.value).toContain('Chennai Central station');
  expect(transportSelect).toHaveValue('bus');

  fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));
  await act(async () => {
    jest.advanceTimersByTime(1500);
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(520);
  });
  const case1Card = screen.getByText('PHT-2024-001').closest('.analysis-result-card');
  expect(case1Card.style.getPropertyValue('--analysis-accent')).toBe('#00e5a0');
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(screen.getByText('WRAITH')).toHaveClass('is-badge-visible');
  fireEvent.click(screen.getByRole('button', { name: /open search zone/i }));

  fireEvent.click(case2Button);
  expect(personNameInput).toHaveValue('Meera Nair');
  expect(notesInput.value).toContain('isolated hiking trails');
  expect(transportSelect).toHaveValue('walking');

  fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));
  await act(async () => {
    jest.advanceTimersByTime(1500);
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(520);
  });
  const case2Card = screen.getByText('PHT-2024-002').closest('.analysis-result-card');
  expect(case2Card.style.getPropertyValue('--analysis-accent')).toBe('#f5a623');
  fireEvent.click(screen.getByRole('button', { name: /open search zone/i }));

  fireEvent.click(case3Button);
  expect(personNameInput).toHaveValue('Unknown Subject');
  expect(notesInput).toHaveValue('No recent phone activity recorded');
  expect(transportSelect).toHaveValue('unknown');

  fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));
  await act(async () => {
    jest.advanceTimersByTime(1500);
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(520);
  });
  const case3Card = screen.getByText('PHT-2024-003').closest('.analysis-result-card');
  expect(case3Card.style.getPropertyValue('--analysis-accent')).toBe('#ff4d4d');
  fireEvent.click(screen.getByRole('button', { name: /open search zone/i }));

  expect(openSpy).toHaveBeenCalledTimes(3);
  openSpy.mockRestore();
  jest.useRealTimers();
});

test('loads the active cases, settings, about, and profile pages with complete content', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /active cases/i }));
  expect(screen.getByRole('heading', { name: 'ACTIVE CASES' })).toBeInTheDocument();
  expect(screen.getByText('All ongoing PHANTOM-WRAITH investigations.')).toBeInTheDocument();
  expect(screen.getByText('PHT-2024-001')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /view analysis/i })).toHaveLength(5);

  fireEvent.click(screen.getByRole('button', { name: /system settings/i }));
  expect(screen.getByRole('heading', { name: 'SYSTEM SETTINGS' })).toBeInTheDocument();
  expect(screen.getByText('AI ENGINE CONFIGURATION')).toBeInTheDocument();
  expect(screen.getByText('NOT SET')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Enter your Gemini API key'), {
    target: { value: 'demo-key' },
  });
  expect(screen.getByText('CONFIGURED')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /light field/i }));
  expect(screen.getByRole('button', { name: /light field/i })).toHaveClass('is-selected');

  fireEvent.click(screen.getByRole('button', { name: /about phantom-wraith/i }));
  expect(screen.getByRole('heading', { name: 'ABOUT PHANTOM-WRAITH' })).toBeInTheDocument();
  expect(screen.getByText('HOW TO RUN AN ANALYSIS')).toBeInTheDocument();
  expect(
    screen.getByText('PHANTOM-WRAITH v1.0 — Prototype Build — MCA Final Year Project')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /investigator profile/i }));
  expect(screen.getByRole('heading', { name: 'INVESTIGATOR PROFILE' })).toBeInTheDocument();
  expect(screen.getAllByText('Lead Investigator').length).toBeGreaterThan(0);
  expect(screen.getByText('ALPHA')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});
