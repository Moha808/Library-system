import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { BOOK_CATEGORIES } from '../services/bookService';

// Configure pdfjs worker
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

/**
 * Match a raw department string to one of the 14 valid FCAHPT Vom categories
 */
export function matchCategory(rawText = '') {
  if (!rawText) return BOOK_CATEGORIES[0];
  const t = rawText.toLowerCase().trim();

  for (const cat of BOOK_CATEGORIES) {
    if (cat.toLowerCase() === t) return cat;
  }

  if (t.includes('public health') || t.includes('epidemiology') || t.includes('disease control') || t.includes('zoonoses')) {
    return 'Public Health & Epidemiology';
  }
  if (t.includes('environmental') || t.includes('sanitation') || t.includes('waste') || t.includes('occupational')) {
    return 'Environmental Health Science';
  }
  if (t.includes('computer') || t.includes('software') || t.includes('database') || t.includes('network') || t.includes('programming') || t.includes('data structure')) {
    return 'Computer Science & IT';
  }
  if (t.includes('home') || t.includes('rural econ') || t.includes('nutrition') || t.includes('dietetics') || t.includes('textile') || t.includes('clothing') || t.includes('family')) {
    return 'Home & Rural Economics';
  }
  if (t.includes('stat') || t.includes('math') || t.includes('biostat') || t.includes('probability') || t.includes('calculus')) {
    return 'Statistics & Mathematics';
  }
  if (t.includes('fish') || t.includes('aquaculture') || t.includes('limnology') || t.includes('pond')) {
    return 'Fisheries & Aquaculture';
  }
  if (t.includes('parasit') || t.includes('pathology') || t.includes('microbiology') || t.includes('helminth')) {
    return 'Veterinary Pathology & Parasitology';
  }
  if (t.includes('vet') || t.includes('surgery') || t.includes('clinical') || t.includes('obstetric') || t.includes('bovine')) {
    return 'Veterinary Medicine & Surgery';
  }
  if (t.includes('nutrition') || t.includes('feed') || t.includes('ruminant')) {
    return 'Animal Nutrition & Feeds';
  }
  if (t.includes('dairy') || t.includes('cattle') || t.includes('sheep') || t.includes('goat') || t.includes('swine') || t.includes('pig') || t.includes('livestock')) {
    return 'Livestock & Dairy Management';
  }
  if (t.includes('poultry') || t.includes('avian') || t.includes('broiler') || t.includes('layer') || t.includes('hatchery') || t.includes('chicken')) {
    return 'Poultry Production & Health';
  }
  if (t.includes('pasture') || t.includes('forage') || t.includes('rangeland') || t.includes('grassland') || t.includes('fodder')) {
    return 'Pasture & Fodder Agronomy';
  }
  if (t.includes('agric') || t.includes('extension') || t.includes('farm management') || t.includes('agribusiness') || t.includes('cooperative')) {
    return 'Agricultural Economics & Extension';
  }

  return 'General & Basic Sciences';
}

/**
 * Extract plain text from Word (.docx) or PDF file
 */
export async function extractTextFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === 'pdf') {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items.map(item => item.str).join(' ');
      fullText += pageItems + '\n';
    }

    return fullText;
  }

  if (extension === 'txt' || extension === 'csv') {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  }

  throw new Error(`Unsupported file type: .${extension}. Please upload a .docx, .pdf, .txt, or .csv file.`);
}

/**
 * Intelligent parser that converts raw extracted document text into book objects
 */
export function parseBooksFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const parsedBooks = [];

  // Check if text has key-value blocks (e.g. Title: ..., Author: ...)
  const hasKeyValues = lines.some(l => /^(title|book|author|isbn|category|dept|department):/i.test(l));

  if (hasKeyValues) {
    let currentBook = null;

    for (const line of lines) {
      const isNewBookMarker = /^(\d+[\.\)]\s*title:|title:)/i.test(line);
      if (isNewBookMarker) {
        if (currentBook && currentBook.title) {
          parsedBooks.push(finalizeBook(currentBook));
        }
        currentBook = {
          title: line.replace(/^.*?title:\s*/i, '').trim(),
          author: '',
          category: '',
          isbn: '',
          totalCopies: 4
        };
        continue;
      }

      if (!currentBook) continue;

      if (/^author:/i.test(line)) {
        currentBook.author = line.replace(/^author:\s*/i, '').trim();
      } else if (/^(category|department|dept):/i.test(line)) {
        currentBook.category = matchCategory(line.replace(/^(category|department|dept):\s*/i, '').trim());
      } else if (/^isbn:/i.test(line)) {
        currentBook.isbn = line.replace(/^isbn:\s*/i, '').trim();
      } else if (/^(copies|total|quantity):/i.test(line)) {
        const val = parseInt(line.replace(/^(copies|total|quantity):\s*/i, '').trim(), 10);
        if (!isNaN(val) && val > 0) currentBook.totalCopies = val;
      }
    }

    if (currentBook && currentBook.title) {
      parsedBooks.push(finalizeBook(currentBook));
    }

    if (parsedBooks.length > 0) return parsedBooks;
  }

  // Otherwise parse line-by-line (tabular, delimited, or formatted lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers or metadata
    if (/^(#|page\s+\d+|federal college|pmb|holdings catalogue|table of contents|library academic catalogue)/i.test(line)) {
      continue;
    }
    if (/^(title\s+author|s\/n\s+title|no\.\s+title)/i.test(line)) {
      continue;
    }

    // Try splitting by tabs, pipes, or commas (CSV style)
    let parts = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim()).filter(Boolean);
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim()).filter(Boolean);
    } else if (line.includes(';') || (line.includes(',') && (line.match(/,/g) || []).length >= 2)) {
      parts = line.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    } else if (line.includes(' - ')) {
      // Split by hyphen separator: Title - Author - Department - ISBN - Copies
      parts = line.split(' - ').map(p => p.trim()).filter(Boolean);
    }

    if (parts.length >= 2) {
      // Clean leading number e.g. "1. Bovine Medicine" -> "Bovine Medicine"
      const title = parts[0].replace(/^\d+[\.\)]\s*/, '').trim();
      const author = parts[1] || 'Unknown Author';
      const categoryRaw = parts[2] || '';
      const isbnRaw = parts[3] || '';
      const copiesRaw = parseInt(parts[4] || '4', 10);

      if (title.length > 2) {
        parsedBooks.push(finalizeBook({
          title,
          author,
          category: matchCategory(categoryRaw),
          isbn: isbnRaw || generateIsbn(),
          totalCopies: isNaN(copiesRaw) ? 4 : copiesRaw
        }));
      }
    } else if (line.length > 10 && !line.startsWith('http') && !line.startsWith('Page ')) {
      // Single line item: "1. Clinical Veterinary Medicine in the Tropics by Prof. Otesile"
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      const byMatch = cleaned.match(/^(.*?)\s+(?:by|-)\s+(.*)$/i);
      if (byMatch) {
        parsedBooks.push(finalizeBook({
          title: byMatch[1].trim(),
          author: byMatch[2].trim(),
          category: matchCategory(cleaned),
          isbn: generateIsbn(),
          totalCopies: 4
        }));
      }
    }
  }

  return parsedBooks;
}

function finalizeBook(item) {
  return {
    title: item.title || 'Untitled Monograph',
    author: item.author || 'Institutional Editorial Board',
    category: matchCategory(item.category || item.title),
    isbn: item.isbn && item.isbn.length > 5 ? item.isbn : generateIsbn(),
    totalCopies: Number(item.totalCopies) || 4,
    availableCopies: Number(item.totalCopies) || 4,
    condition: 'good',
    shelfLocation: 'Stack Auto-' + Math.floor(1 + Math.random() * 8),
    description: `Digitally ingested monograph for FCAHPT Vom curricula.`
  };
}

function generateIsbn() {
  return `978-978-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`;
}
