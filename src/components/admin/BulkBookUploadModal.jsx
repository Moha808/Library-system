import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Layers, 
  ArrowRight, 
  Download,
  FileCheck
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { extractTextFromFile, parseBooksFromText, matchCategory } from '../../utils/documentParser';
import { BOOK_CATEGORIES, createBook } from '../../services/bookService';
import toast from 'react-hot-toast';

export function BulkBookUploadModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedBooks, setParsedBooks] = useState([]);
  const [rawTextPreview, setRawTextPreview] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  function resetState() {
    setFile(null);
    setParsing(false);
    setParsedBooks([]);
    setRawTextPreview('');
    setImporting(false);
    setImportProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    if (importing) return;
    resetState();
    onClose();
  }

  async function processSelectedFile(selectedFile) {
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['docx', 'pdf', 'txt', 'csv'].includes(extension)) {
      toast.error('Unsupported file format. Please upload a Word (.docx), PDF (.pdf), or Text/CSV file.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setParsedBooks([]);

    try {
      const text = await extractTextFromFile(selectedFile);
      setRawTextPreview(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      const books = parseBooksFromText(text);

      if (books.length === 0) {
        toast.error('Could not auto-detect book records in the document. Please verify the format or paste titles manually.');
      } else {
        toast.success(`Extracted ${books.length} book titles from ${selectedFile.name}`);
      }
      setParsedBooks(books);
    } catch (err) {
      console.error('File parsing error:', err);
      toast.error(err.message || 'Failed to extract text from document');
    } finally {
      setParsing(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }

  function handleFieldChange(index, field, value) {
    setParsedBooks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleRemoveBook(index) {
    setParsedBooks(prev => prev.filter((_, i) => i !== index));
  }

  function handleAddEmptyRow() {
    setParsedBooks(prev => [
      ...prev,
      {
        title: '',
        author: '',
        category: BOOK_CATEGORIES[0],
        isbn: `978-978-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`,
        totalCopies: 4,
        availableCopies: 4,
        condition: 'good',
        shelfLocation: 'Stack Auto-1',
        description: 'Uploaded via Bulk Document Ingestion'
      }
    ]);
  }

  async function handleExecuteImport() {
    const validBooks = parsedBooks.filter(b => b.title && b.title.trim());
    if (validBooks.length === 0) {
      toast.error('No valid books to import. Every book requires at least a Title.');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: validBooks.length });

    let successCount = 0;
    try {
      for (let i = 0; i < validBooks.length; i++) {
        const b = validBooks[i];
        await createBook({
          title: b.title.trim(),
          author: b.author ? b.author.trim() : 'FCAHPT Faculty',
          category: b.category || 'General & Basic Sciences',
          isbn: b.isbn || '',
          totalCopies: Number(b.totalCopies) || 4,
          availableCopies: Number(b.totalCopies) || 4,
          condition: 'good',
          shelfLocation: b.shelfLocation || 'Stack Main',
          description: b.description || 'Imported via Bulk Document Ingestion'
        });
        successCount++;
        setImportProgress({ current: successCount, total: validBooks.length });
      }

      toast.success(`Successfully imported ${successCount} books into FCAHPT Library catalogue!`);
      if (onImportComplete) onImportComplete();
      handleClose();
    } catch (err) {
      toast.error(`Error during batch import: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Ingest Books via PDF / Word Document"
      size="xl"
    >
      <div className="space-y-5">
        {/* Step 1: Upload Area */}
        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-emerald-600 bg-emerald-50/50' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt,.csv"
              onChange={e => e.target.files && processSelectedFile(e.target.files[0])}
              className="hidden"
              id="bulk-doc-input"
            />
            
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Select or Drop Book List Document
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Upload Microsoft Word (.docx), PDF (.pdf), or delimited Text files containing library books, accession lists, or department syllabi.
            </p>

            <label
              htmlFor="bulk-doc-input"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-2xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Browse Word or PDF File</span>
            </label>

            <div className="mt-6 pt-4 border-t border-slate-200/80 text-left text-2xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-0.5">Recommended PDF/Word Format:</span>
                <code>Title - Author - Department - Copies</code>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-0.5">Or Key-Value Format:</span>
                <code>Title: ... Author: ... Dept: ...</code>
              </div>
            </div>
          </div>
        )}

        {/* Parsing Progress */}
        {parsing && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-800">Extracting and analyzing text from {file?.name}...</p>
            <p className="text-2xs text-slate-500">Mapping departmental categories and monograph metadata</p>
          </div>
        )}

        {/* Step 2: Parsed Table & Verification */}
        {file && !parsing && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold truncate">{file.name}</span>
                <span className="text-slate-400 text-2xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-2xs font-bold text-slate-500 hover:text-red-600 px-2 py-1"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Books Preview List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-2xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Author</th>
                    <th className="py-2 px-3">Department Category</th>
                    <th className="py-2 px-2 text-center w-16">Copies</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedBooks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-400">
                        No book records extracted. Click "Add Line" above or re-check document text.
                      </td>
                    </tr>
                  ) : (
                    parsedBooks.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={b.title}
                            onChange={e => handleFieldChange(idx, 'title', e.target.value)}
                            placeholder="Title..."
                            className="w-full px-2 py-1 rounded-md border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={b.author}
                            onChange={e => handleFieldChange(idx, 'author', e.target.value)}
                            placeholder="Author..."
                            className="w-full px-2 py-1 rounded-md border border-slate-200 text-slate-700 focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={b.category}
                            onChange={e => handleFieldChange(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1 rounded-md border border-slate-200 text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500 text-2xs"
                          >
                            {BOOK_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={b.totalCopies}
                            onChange={e => handleFieldChange(idx, 'totalCopies', e.target.value)}
                            className="w-14 px-1 py-1 text-center rounded-md border border-slate-200 text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBook(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary & Import Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-600 font-medium">
                Ready to ingest <strong className="text-slate-900">{parsedBooks.filter(b => b.title.trim()).length}</strong> books across multidisciplinary faculties.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={importing}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || parsedBooks.filter(b => b.title.trim()).length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {importing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing ({importProgress.current}/{importProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ingest into Library Catalogue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
