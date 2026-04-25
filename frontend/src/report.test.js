import { mockResponse } from './mockResponse';
import { populateCaseReport } from './report';

test('writes the case report content into the PDF document', () => {
  const doc = {
    getTextWidth: jest.fn(() => 20),
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    splitTextToSize: jest.fn(text => [text]),
    text: jest.fn(),
  };

  populateCaseReport(doc, {
    result: mockResponse,
    subjectName: 'Ravi Kumar',
    mapsUrl: 'https://www.google.com/maps/@13.0827,80.2707,13z',
  });

  expect(doc.text).toHaveBeenCalledWith('PHANTOM-WRAITH CASE REPORT', 16, 20);
  expect(doc.text).toHaveBeenCalledWith('WRAITH ANALYSIS', 16, expect.any(Number));
  expect(doc.text).toHaveBeenCalledWith('SIGNAL BREAKDOWN', 16, expect.any(Number));
  expect(doc.text).toHaveBeenCalledWith('DATA GAPS', 16, expect.any(Number));
  expect(doc.text).toHaveBeenCalledWith('SEARCH ZONE URL', 16, expect.any(Number));
  expect(
    doc.splitTextToSize.mock.calls.some(([value]) => value === 'Ravi Kumar')
  ).toBe(true);
  expect(
    doc.splitTextToSize.mock.calls.some(([value]) => value === mockResponse.reasoning)
  ).toBe(true);
  expect(
    doc.splitTextToSize.mock.calls.some(([value]) =>
      value.includes(mockResponse.signal_breakdown.movement)
    )
  ).toBe(true);
  expect(
    doc.splitTextToSize.mock.calls.some(([value]) =>
      value === 'https://www.google.com/maps/@13.0827,80.2707,13z'
    )
  ).toBe(true);
});
