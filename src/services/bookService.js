import { 
  fetchCollection, 
  fetchDocument, 
  insertDocument, 
  modifyDocument, 
  removeDocument 
} from '../firebase/dbAdapter';

export const BOOK_CATEGORIES = [
  'Public Health & Epidemiology',
  'Environmental Health Science',
  'Computer Science & IT',
  'Home & Rural Economics',
  'Statistics & Mathematics',
  'Fisheries & Aquaculture',
  'Veterinary Medicine & Surgery',
  'Veterinary Pathology & Parasitology',
  'Animal Nutrition & Feeds',
  'Livestock & Dairy Management',
  'Poultry Production & Health',
  'Pasture & Fodder Agronomy',
  'Agricultural Economics & Extension',
  'General & Basic Sciences'
];

/**
 * Fetch all books with optional search query and category filter
 */
export async function getAllBooks({ search = '', category = '', availableOnly = false } = {}) {
  let books = await fetchCollection('books', [], { field: 'title', direction: 'asc' });

  if (category) {
    books = books.filter(b => b.category === category);
  }

  if (availableOnly) {
    books = books.filter(b => (b.availableCopies || 0) > 0);
  }

  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    books = books.filter(b => 
      (b.title && b.title.toLowerCase().includes(term)) ||
      (b.author && b.author.toLowerCase().includes(term)) ||
      (b.isbn && b.isbn.toLowerCase().includes(term)) ||
      (b.category && b.category.toLowerCase().includes(term))
    );
  }

  return books;
}

export async function getBookById(bookId) {
  return await fetchDocument('books', bookId);
}

export async function createBook(bookData) {
  const total = parseInt(bookData.totalCopies, 10) || 1;
  const available = parseInt(bookData.availableCopies ?? total, 10);

  const payload = {
    title: bookData.title.trim(),
    author: bookData.author.trim(),
    category: bookData.category || 'General & Basic Sciences',
    isbn: bookData.isbn ? bookData.isbn.trim() : `ISBN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    totalCopies: total,
    availableCopies: available,
    status: available > 0 ? 'available' : 'borrowed',
    condition: bookData.condition || 'good',
    shelfLocation: bookData.shelfLocation || 'Section A',
    description: bookData.description || '',
    createdAt: new Date().toISOString()
  };

  return await insertDocument('books', payload);
}

export async function updateBook(bookId, bookData) {
  const total = parseInt(bookData.totalCopies, 10) || 1;
  const available = Math.min(total, parseInt(bookData.availableCopies ?? total, 10));

  const payload = {
    ...bookData,
    totalCopies: total,
    availableCopies: available,
    status: available > 0 ? 'available' : 'borrowed',
    updatedAt: new Date().toISOString()
  };

  return await modifyDocument('books', bookId, payload);
}

export async function deleteBook(bookId) {
  // Check if any copies are currently out on loan
  const activeLoans = await fetchCollection('borrowings', [
    { field: 'bookId', op: '==', value: bookId },
    { field: 'status', op: 'in', value: ['issued', 'overdue'] }
  ]);

  if (activeLoans.length > 0) {
    throw new Error(`Cannot delete this book: ${activeLoans.length} copies are currently on active loan.`);
  }

  return await removeDocument('books', bookId);
}
