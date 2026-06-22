import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Chip,
  Alert, Stack, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useBulkCreateQuestionsMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

// ── Template columns ──────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  'question', 'type', 'option_a', 'option_b', 'option_c', 'option_d',
  'correct_option', 'marks', 'model_answer',
];

const TEMPLATE_ROWS = [
  ['What is 2 + 2?', 'mcq', '3', '4', '5', '6', 'B', '1', ''],
  ['Explain polymorphism in OOP.', 'subjective', '', '', '', '', '', '5', 'Polymorphism allows objects of different types to be treated as objects of a common supertype...'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const wsData = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 50 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 15 }, { wch: 8 }, { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, 'question_template.xlsx');
};

const CORRECT_MAP = { a: 0, b: 1, c: 2, d: 3 };

const parseRow = (row, idx) => {
  const question = String(row['question'] || '').trim();
  const type = String(row['type'] || 'mcq').trim().toLowerCase();
  const marks = parseFloat(row['marks']) || 1;
  const modelAnswer = String(row['model_answer'] || '').trim();
  const correctLetter = String(row['correct_option'] || '').trim().toLowerCase();

  const errors = [];
  if (!question) errors.push('question text missing');
  if (!['mcq', 'subjective'].includes(type)) errors.push(`unknown type "${type}"`);
  if (marks <= 0) errors.push('marks must be > 0');

  let options = [];
  if (type === 'mcq') {
    const optTexts = [
      String(row['option_a'] || '').trim(),
      String(row['option_b'] || '').trim(),
      String(row['option_c'] || '').trim(),
      String(row['option_d'] || '').trim(),
    ];
    const filled = optTexts.filter(Boolean);
    if (filled.length < 2) errors.push('at least 2 options required');
    if (!correctLetter || CORRECT_MAP[correctLetter] === undefined) errors.push('correct_option must be A/B/C/D');

    const correctIdx = CORRECT_MAP[correctLetter];
    options = optTexts
      .map((text, i) => ({ optionText: text, isCorrect: i === correctIdx }))
      .filter((o) => o.optionText);
  } else if (type === 'subjective') {
    if (!modelAnswer) errors.push('model_answer required for subjective');
  }

  return {
    _row: idx + 2, // 1-indexed, +1 for header
    question,
    questionType: type,
    options,
    modelAnswer,
    ansmarks: marks,
    _errors: errors,
    _valid: errors.length === 0,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function BulkImportModal({ open, onClose, examId, onImported }) {
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const [bulkCreateQuestions] = useBulkCreateQuestionsMutation();

  const validQuestions = parsedQuestions.filter((q) => q._valid);
  const invalidCount = parsedQuestions.length - validQuestions.length;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setParsedQuestions(rows.map(parseRow));
      } catch (err) {
        toast.error('Failed to parse file. Make sure it is a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!validQuestions.length) return;
    setImporting(true);
    try {
      const payload = validQuestions.map(({ question, questionType, options, modelAnswer, ansmarks }) => ({
        question, questionType, options, modelAnswer, ansmarks,
      }));
      const result = await bulkCreateQuestions({ examId, questions: payload }).unwrap();
      toast.success(`${result.count} question${result.count !== 1 ? 's' : ''} imported successfully!`);
      onImported?.();
      handleClose();
    } catch (err) {
      toast.error(err?.data?.error || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsedQuestions([]);
    setFileName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700} color="#003974">
          Bulk Import Questions
        </Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Instructions */}
          <Alert severity="info" sx={{ borderRadius: '8px' }}>
            <Typography variant="body2" fontWeight={600} mb={0.5}>How to use:</Typography>
            <Typography variant="body2">
              1. Download the template below &nbsp;→&nbsp; 2. Fill in your questions in Excel or Google Sheets
              &nbsp;→&nbsp; 3. Save as <b>.xlsx</b> or <b>.csv</b> &nbsp;→&nbsp; 4. Upload and review &nbsp;→&nbsp; 5. Import
            </Typography>
            <Typography variant="body2" mt={0.5}>
              <b>correct_option</b> should be <b>A</b>, <b>B</b>, <b>C</b>, or <b>D</b>. Leave blank for subjective questions.
            </Typography>
          </Alert>

          {/* Actions row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              sx={{ borderRadius: '8px', borderColor: '#003974', color: '#003974' }}
            >
              Download Template (.xlsx)
            </Button>

            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileRef.current.click()}
              sx={{ borderRadius: '8px', backgroundColor: '#003974' }}
            >
              {fileName ? 'Change File' : 'Upload File (.xlsx / .csv)'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFile}
            />

            {fileName && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {fileName}
              </Typography>
            )}
          </Stack>

          {/* Summary chips */}
          {parsedQuestions.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${parsedQuestions.length} rows parsed`} size="small" />
              <Chip
                icon={<CheckCircleIcon />}
                label={`${validQuestions.length} valid`}
                size="small"
                sx={{ backgroundColor: '#dcfce7', color: '#166534' }}
              />
              {invalidCount > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${invalidCount} with errors`}
                  size="small"
                  sx={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                />
              )}
            </Stack>
          )}

          {/* Preview table */}
          {parsedQuestions.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360, borderRadius: '8px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 50 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Question</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedQuestions.map((q, i) => (
                    <TableRow
                      key={i}
                      sx={{ backgroundColor: q._valid ? 'transparent' : '#fff5f5' }}
                    >
                      <TableCell>{q._row}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {q.question || <em style={{ color: '#999' }}>—</em>}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={q.questionType}
                          size="small"
                          sx={{
                            backgroundColor: q.questionType === 'mcq' ? '#e0f2fe' : '#f0fdf4',
                            color: q.questionType === 'mcq' ? '#0369a1' : '#166534',
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>{q.ansmarks}</TableCell>
                      <TableCell>
                        {q._valid
                          ? <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                          : <ErrorIcon sx={{ color: '#dc2626', fontSize: 18 }} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {q._errors.join(', ')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {importing && <LinearProgress sx={{ borderRadius: 4 }} />}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={validQuestions.length === 0 || importing}
          sx={{ borderRadius: '8px', backgroundColor: '#003974', minWidth: 160 }}
        >
          {importing ? 'Importing...' : `Import ${validQuestions.length} Question${validQuestions.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
