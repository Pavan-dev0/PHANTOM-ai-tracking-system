import { jsPDF } from 'jspdf';

function addWrappedPdfText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(String(text || 'N/A'), maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function addPdfLine(doc, label, value, x, y, maxWidth, lineHeight) {
  const prefix = `${label}: `;

  doc.setFont('helvetica', 'bold');
  doc.text(prefix, x, y);

  doc.setFont('helvetica', 'normal');
  const labelWidth = doc.getTextWidth(prefix);
  const valueLines = doc.splitTextToSize(
    String(value || 'N/A'),
    Math.max(maxWidth - labelWidth, 40)
  );

  doc.text(valueLines, x + labelWidth, y);
  return y + (Math.max(valueLines.length, 1) * lineHeight);
}

export function populateCaseReport(doc, { result, subjectName, mapsUrl }) {
  const left = 16;
  const maxWidth = 178;
  const lineHeight = 7;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PHANTOM-WRAITH CASE REPORT', left, y);
  y += 12;

  doc.setFontSize(11);
  y = addPdfLine(doc, 'Case ID', result.case_id, left, y, maxWidth, lineHeight);
  y = addPdfLine(doc, 'Timestamp', result.timestamp, left, y, maxWidth, lineHeight);
  y = addPdfLine(doc, 'Subject', subjectName, left, y, maxWidth, lineHeight);
  y = addPdfLine(
    doc,
    'Destination Category',
    result.destination_category,
    left,
    y,
    maxWidth,
    lineHeight
  );
  y = addPdfLine(
    doc,
    'Confidence',
    `${Math.round((result.confidence || 0) * 100)}%`,
    left,
    y,
    maxWidth,
    lineHeight
  );
  y = addPdfLine(
    doc,
    'Dominant Engine',
    result.dominant_engine,
    left,
    y,
    maxWidth,
    lineHeight
  );

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('WRAITH ANALYSIS', left, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedPdfText(doc, result.reasoning, left, y, maxWidth, 6) + 3;

  doc.setFont('helvetica', 'bold');
  doc.text('SIGNAL BREAKDOWN', left, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedPdfText(
    doc,
    `Movement: ${result.signal_breakdown?.movement || 'N/A'}`,
    left,
    y,
    maxWidth,
    6
  );
  y = addWrappedPdfText(
    doc,
    `Cognitive: ${result.signal_breakdown?.cognitive || 'N/A'}`,
    left,
    y,
    maxWidth,
    6
  );
  y = addWrappedPdfText(
    doc,
    `Device: ${result.signal_breakdown?.device || 'N/A'}`,
    left,
    y,
    maxWidth,
    6
  ) + 3;

  doc.setFont('helvetica', 'bold');
  doc.text('DATA GAPS', left, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedPdfText(doc, result.gaps || 'None', left, y, maxWidth, 6) + 3;

  doc.setFont('helvetica', 'bold');
  doc.text('SEARCH ZONE URL', left, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  addWrappedPdfText(doc, mapsUrl, left, y, maxWidth, 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('PHANTOM-WRAITH v1.0 — Prototype Build', left, 287);
}

export function createCaseReport(payload) {
  const doc = new jsPDF();
  populateCaseReport(doc, payload);
  return doc;
}
