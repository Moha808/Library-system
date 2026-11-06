import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  UploadCloud,
  Download
} from 'lucide-react';
import { 
  getAllBooks, 
  createBook, 
  updateBook, 
  deleteBook, 
  BOOK_CATEGORIES 
} from '../../services/bookService';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { BulkBookUploadModal } from '../../components/admin/BulkBookUploadModal';
import toast from 'react-hot-toast';

export function BooksManagementPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: BOOK_CATEGORIES[0],
    isbn: '',
    totalCopies: 5,
    availableCopies: 5,
    condition: 'good',
    shelfLocation: 'Stack A-1',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [search, category]);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await getAllBooks({ search, category });
      setBooks(data);
    } catch (e) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      category: BOOK_CATEGORIES[0],
      isbn: `978-978-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`,
      totalCopies: 4,
      availableCopies: 4,
      condition: 'good',
      shelfLocation: 'Stack A-1',
      description: 'Official academic literature for FCAHPT Vom students.'
    });
    setModalOpen(true);
  }

  function handleOpenEdit(book) {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn || '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      condition: book.condition || 'good',
      shelfLocation: book.shelfLocation || 'Stack A-1',
      description: book.description || ''
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error('Title and Author are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBook) {
        await updateBook(editingBook.id, formData);
        toast.success(`Book "${formData.title}" updated successfully`);
      } else {
        await createBook(formData);
        toast.success(`Book "${formData.title}" added to library inventory`);
      }
      setModalOpen(false);
      loadBooks();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(book) {
    setBookToDelete(book);
  }

  async function handleConfirmDelete() {
    if (!bookToDelete) return;
    setDeleting(true);
    try {
      await deleteBook(bookToDelete.id);
      toast.success(`Book "${bookToDelete.title}" removed from catalogue`);
      setBookToDelete(null);
      loadBooks();
    } catch (err) {
      toast.error(err.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Library Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register new textbooks, manage physical stock copies, track shelf conditions, and edit catalogue details across all FCAHPT Vom faculties
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <a
            href="/FCAHPT_Vom_Library_Books_Catalogue.pdf"
            download="FCAHPT_Vom_Library_Books_Catalogue.pdf"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 hover:text-emerald-800 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title="Download complete printed catalogue in PDF format"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Catalogue (PDF)</span>
          </a>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
            title="Upload book records from Word (.docx) or PDF document"
          >
            <UploadCloud className="w-4 h-4 text-emerald-700" />
            <span>Upload Word / PDF</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalogue by title, author, or ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="min-w-[220px]">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Academic Disciplines</option>
            {BOOK_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Books */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No books found in catalogue</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Title & Author</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">ISBN & Shelf</th>
                  <th className="py-3 px-4 text-center">Available Copies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {books.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{b.title}</p>
                      <p className="text-2xs text-slate-500 mt-0.5">By {b.author}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-2xs font-semibold">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-3xs">
                      <p>{b.isbn}</p>
                      <p className="text-slate-400">{b.shelfLocation}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold font-mono ${
                        (b.availableCopies || 0) > 0 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {b.availableCopies} / {b.totalCopies} on shelf
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Book Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBook ? 'Edit Book Details' : 'Add New Book to Inventory'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Book Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Veterinary Clinical Pathology in Ruminants"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Author(s)
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g., Prof. K. A. N. Esievo"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {BOOK_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="978-978-..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Total Copies
              </label>
              <input
                type="number"
                min={1}
                value={formData.totalCopies}
                onChange={e => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setFormData({ 
                    ...formData, 
                    totalCopies: val, 
                    availableCopies: Math.min(val, formData.availableCopies) 
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Available Copies
              </label>
              <input
                type="number"
                min={0}
                max={formData.totalCopies}
                value={formData.availableCopies}
                onChange={e => setFormData({ ...formData, availableCopies: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Shelf Location
              </label>
              <input
                type="text"
                value={formData.shelfLocation}
                onChange={e => setFormData({ ...formData, shelfLocation: e.target.value })}
                placeholder="e.g., Section C, Row 3"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Physical Condition
              </label>
              <select
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="good">Good / Excellent</option>
                <option value="fair">Fair / Normal Wear</option>
                <option value="damaged">Damaged / Requires Repair</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      <BulkBookUploadModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onImportComplete={loadBooks}
      />

      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        onClose={() => setBookToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Book from Inventory"
        message={bookToDelete ? `Are you sure you want to permanently remove "${bookToDelete.title}" by ${bookToDelete.author} from the FCAHPT library database? This action cannot be undone.` : ''}
        confirmText="Remove Book"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}
