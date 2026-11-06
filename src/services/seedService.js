import { 
  populateLocalCollection, 
  saveDocument, 
  batchWrite, 
  DEFAULT_SCORING_SETTINGS,
  fetchCollection 
} from '../firebase/dbAdapter';
import { db, isConfigured, forceDemoMode } from '../firebase/config';

// 87 Comprehensive Monograph Titles across ALL 14 Multidisciplinary Departments at FCAHPT Vom
export const RAW_BOOKS = [
  // Veterinary Medicine & Surgery
  { title: 'Clinical Veterinary Medicine in the Tropics', author: 'Prof. E. B. Otesile', category: 'Veterinary Medicine & Surgery', total: 5, avail: 5, isbn: '978-978-842-101-1' },
  { title: 'Veterinary Surgical Techniques & Anaesthesia', author: 'Dr. C. O. Adeyanju', category: 'Veterinary Medicine & Surgery', total: 4, avail: 4, isbn: '978-978-842-102-8' },
  { title: 'Bovine Medicine: Diseases and Husbandry of Cattle', author: 'A. H. Andrews & R. W. Blowey', category: 'Veterinary Medicine & Surgery', total: 3, avail: 3, isbn: '978-978-842-103-5' },
  { title: 'Small Animal Internal Medicine & Pharmacology', author: 'Richard W. Nelson', category: 'Veterinary Medicine & Surgery', total: 4, avail: 4, isbn: '978-978-842-104-2' },
  { title: 'Veterinary Obstetrics & Genital Diseases in the Tropics', author: 'Prof. S. U. Abdullahi', category: 'Veterinary Medicine & Surgery', total: 4, avail: 4, isbn: '978-978-842-160-8' },
  { title: 'Veterinary Diagnostic Imaging & Radiography', author: 'Dr. B. M. Jahun', category: 'Veterinary Medicine & Surgery', total: 3, avail: 3, isbn: '978-978-842-161-5' },
  
  // Veterinary Pathology & Parasitology
  { title: 'Veterinary Pathology for the Tropics', author: 'Prof. K. A. N. Esievo', category: 'Veterinary Pathology & Parasitology', total: 5, avail: 5, isbn: '978-978-842-120-2' },
  { title: 'Veterinary Parasitology and Vector-Borne Diseases', author: 'M. A. Taylor & R. L. Coop', category: 'Veterinary Pathology & Parasitology', total: 4, avail: 4, isbn: '978-978-842-121-9' },
  { title: 'Animal Helminthology and Protozoology', author: 'Prof. S. N. Chiejina', category: 'Veterinary Pathology & Parasitology', total: 4, avail: 4, isbn: '978-978-842-122-6' },
  { title: 'Veterinary Clinical Microbiology & Immunology', author: 'P. J. Quinn & B. K. Markey', category: 'Veterinary Pathology & Parasitology', total: 5, avail: 5, isbn: '978-978-842-123-3' },
  { title: 'Veterinary Clinical Pathology & Haematology', author: 'Dr. K. A. Sani', category: 'Veterinary Pathology & Parasitology', total: 4, avail: 4, isbn: '978-978-842-162-2' },
  { title: 'Principles of Veterinary Necropsy & Post-Mortem Diagnosis', author: 'Dr. T. U. Obi', category: 'Veterinary Pathology & Parasitology', total: 3, avail: 3, isbn: '978-978-842-163-9' },

  // Public Health & Epidemiology
  { title: 'Principles of Epidemiology & Public Health Practice', author: 'Dr. C. H. Hennekens', category: 'Public Health & Epidemiology', total: 5, avail: 5, isbn: '978-978-842-141-7' },
  { title: 'Communicable Disease Control in Tropical Africa', author: 'Prof. A. O. Lucas & H. M. Gilles', category: 'Public Health & Epidemiology', total: 4, avail: 4, isbn: '978-978-842-142-4' },
  { title: 'Zoonoses and Communicable Diseases Common to Man and Animals', author: 'P. N. Acha & B. Szyfres', category: 'Public Health & Epidemiology', total: 4, avail: 4, isbn: '978-978-842-143-1' },
  { title: 'Community Health Assessment & Primary Healthcare Delivery', author: 'Dr. E. A. Bamgboye', category: 'Public Health & Epidemiology', total: 4, avail: 4, isbn: '978-978-842-164-6' },
  { title: 'One Health: Interdisciplinary Approaches to Health & Environment', author: 'Ronald M. Atlas', category: 'Public Health & Epidemiology', total: 5, avail: 5, isbn: '978-978-842-165-3' },
  { title: 'Disease Surveillance and Outbreak Investigation in West Africa', author: 'Dr. Patrick M. Nguku', category: 'Public Health & Epidemiology', total: 4, avail: 4, isbn: '978-978-842-166-0' },
  { title: 'Immunization Science & Cold Chain Logistics', author: 'Dr. Folashade Omokhodion', category: 'Public Health & Epidemiology', total: 3, avail: 3, isbn: '978-978-842-167-7' },

  // Environmental Health Science
  { title: 'Environmental Health Engineering & Waste Management', author: 'Dr. P. T. Gyang & M. O. Sridhar', category: 'Environmental Health Science', total: 5, avail: 5, isbn: '978-978-842-144-8' },
  { title: 'Water Quality, Sanitation and Hygiene in Rural Nigeria', author: 'Engr. D. K. Pam', category: 'Environmental Health Science', total: 4, avail: 4, isbn: '978-978-842-145-5' },
  { title: 'Occupational Health and Industrial Safety for Colleges', author: 'Dr. S. K. Olatunji', category: 'Environmental Health Science', total: 3, avail: 3, isbn: '978-978-842-146-2' },
  { title: 'Vector Biology and Integrated Pest Management in Tropics', author: 'Prof. M. C. Dike', category: 'Environmental Health Science', total: 4, avail: 4, isbn: '978-978-842-168-4' },
  { title: 'Municipal Solid Waste Treatment and Recycling Technologies', author: 'Dr. G. O. Longe', category: 'Environmental Health Science', total: 4, avail: 4, isbn: '978-978-842-169-1' },
  { title: 'Air Pollution Monitoring and Environmental Impact Assessment', author: 'Dr. B. A. Chokor', category: 'Environmental Health Science', total: 3, avail: 3, isbn: '978-978-842-170-7' },
  { title: 'Food Hygiene and Abattoir Inspection Standards', author: 'Dr. A. T. Alonge', category: 'Environmental Health Science', total: 5, avail: 5, isbn: '978-978-842-171-4' },

  // Computer Science & IT
  { title: 'Introduction to Computer Science & Data Processing', author: 'Timothy J. O\'Leary', category: 'Computer Science & IT', total: 6, avail: 6, isbn: '978-978-842-130-1' },
  { title: 'Database Systems Design and Implementation', author: 'Carlos Coronel & Steven Morris', category: 'Computer Science & IT', total: 4, avail: 4, isbn: '978-978-842-131-8' },
  { title: 'Python Programming for Science and Data Analysis', author: 'Mark Lutz', category: 'Computer Science & IT', total: 5, avail: 5, isbn: '978-978-842-172-1' },
  { title: 'Computer Networks and Distributed Information Systems', author: 'Andrew S. Tanenbaum', category: 'Computer Science & IT', total: 4, avail: 4, isbn: '978-978-842-173-8' },
  { title: 'Web Technologies and Database-Driven Applications', author: 'Robin Nixon', category: 'Computer Science & IT', total: 5, avail: 5, isbn: '978-978-842-174-5' },
  { title: 'Data Structures and Algorithms with Applications', author: 'Michael T. Goodrich', category: 'Computer Science & IT', total: 4, avail: 4, isbn: '978-978-842-175-2' },
  { title: 'Information Systems for Farm Records & Livestock Registries', author: 'Dr. K. E. Adekoya', category: 'Computer Science & IT', total: 3, avail: 3, isbn: '978-978-842-133-2' },

  // Home & Rural Economics
  { title: 'Human Nutrition, Dietetics & Rural Community Development', author: 'Prof. E. O. Ojofeitimi', category: 'Home & Rural Economics', total: 5, avail: 5, isbn: '978-978-842-147-9' },
  { title: 'Food Processing, Preservation and Post-Harvest Technology', author: 'Dr. F. A. Oladipo', category: 'Home & Rural Economics', total: 4, avail: 4, isbn: '978-978-842-148-6' },
  { title: 'Family Resource Management and Rural Consumer Economics', author: 'Dr. Mary A. Lar', category: 'Home & Rural Economics', total: 4, avail: 4, isbn: '978-978-842-149-3' },
  { title: 'Textile Science, Clothing Construction and Garment Design', author: 'Dr. E. K. Anyakoha', category: 'Home & Rural Economics', total: 4, avail: 4, isbn: '978-978-842-176-9' },
  { title: 'Child Development, Family Welfare and Caregiving in Rural Africa', author: 'Prof. V. N. Okeke', category: 'Home & Rural Economics', total: 4, avail: 4, isbn: '978-978-842-177-6' },
  { title: 'Agribusiness Micro-Enterprises and Women Cooperatives', author: 'Dr. Comfort A. Adebayo', category: 'Home & Rural Economics', total: 3, avail: 3, isbn: '978-978-842-178-3' },

  // Statistics & Mathematics
  { title: 'Statistical Methods for Applied Sciences & Biostatistics', author: 'G. W. Snedecor & W. G. Cochran', category: 'Statistics & Mathematics', total: 5, avail: 5, isbn: '978-978-842-150-9' },
  { title: 'Applied Probability Theory and Quantitative Research', author: 'Prof. J. O. Oyelami', category: 'Statistics & Mathematics', total: 4, avail: 4, isbn: '978-978-842-151-6' },
  { title: 'Experimental Design and Analysis of Variance in Agriculture', author: 'Douglas C. Montgomery', category: 'Statistics & Mathematics', total: 4, avail: 4, isbn: '978-978-842-179-0' },
  { title: 'Sampling Techniques and Survey Methodology in Developing Nations', author: 'William G. Cochran', category: 'Statistics & Mathematics', total: 4, avail: 4, isbn: '978-978-842-180-6' },
  { title: 'Operations Research and Linear Programming for Polytechnics', author: 'Hamdy A. Taha', category: 'Statistics & Mathematics', total: 4, avail: 4, isbn: '978-978-842-181-3' },
  { title: 'Mathematical Methods for Physical and Biological Sciences', author: 'Erwin Kreyszig', category: 'Statistics & Mathematics', total: 5, avail: 5, isbn: '978-978-842-182-0' },

  // Fisheries & Aquaculture
  { title: 'Aquaculture and Fish Farming in Freshwaters', author: 'Dr. A. A. Eyo', category: 'Fisheries & Aquaculture', total: 5, avail: 5, isbn: '978-978-842-124-0' },
  { title: 'Fish Pathology and Aquatic Health Management', author: 'Ronald J. Roberts', category: 'Fisheries & Aquaculture', total: 3, avail: 3, isbn: '978-978-842-125-7' },
  { title: 'Catfish Hatchery and Pond Production in Plateau State', author: 'Engr. J. K. Dung', category: 'Fisheries & Aquaculture', total: 4, avail: 4, isbn: '978-978-842-126-4' },
  { title: 'Fish Nutrition, Feed Formulation and Broodstock Management', author: 'Prof. S. O. Talabi', category: 'Fisheries & Aquaculture', total: 4, avail: 4, isbn: '978-978-842-183-7' },
  { title: 'Limnology and Freshwater Ecology of Nigerian Inland Waters', author: 'Prof. H. A. Adeniji', category: 'Fisheries & Aquaculture', total: 4, avail: 4, isbn: '978-978-842-184-4' },
  { title: 'Post-Harvest Fish Processing, Smoking and Quality Assurance', author: 'Dr. A. I. Ikeme', category: 'Fisheries & Aquaculture', total: 4, avail: 4, isbn: '978-978-842-185-1' },

  // Animal Nutrition & Feeds
  { title: 'Principles of Animal Nutrition in West Africa', author: 'Prof. J. A. Oluyemi', category: 'Animal Nutrition & Feeds', total: 6, avail: 6, isbn: '978-978-842-105-9' },
  { title: 'Feeds and Feeding for Tropical Livestock', author: 'Dr. M. A. Bamikole', category: 'Animal Nutrition & Feeds', total: 5, avail: 5, isbn: '978-978-842-106-6' },
  { title: 'Applied Ruminant Nutrition & Feed Compounding', author: 'Peter R. Cheeke', category: 'Animal Nutrition & Feeds', total: 4, avail: 4, isbn: '978-978-842-107-3' },
  { title: 'Non-Conventional Feed Resources in Nigerian Agriculture', author: 'Dr. S. O. Ogundipe', category: 'Animal Nutrition & Feeds', total: 3, avail: 3, isbn: '978-978-842-108-0' },
  { title: 'Feed Microscopy, Analytical Proximate and Quality Control', author: 'Dr. T. E. Ekpenyong', category: 'Animal Nutrition & Feeds', total: 4, avail: 4, isbn: '978-978-842-186-8' },
  { title: 'Forage and Pasture Nutrition for Semi-Arid Pastoral Zones', author: 'Dr. O. J. Ifut', category: 'Animal Nutrition & Feeds', total: 4, avail: 4, isbn: '978-978-842-187-5' },

  // Livestock & Dairy Management
  { title: 'Tropical Cattle Production & Dairy Husbandry', author: 'W. J. A. Payne & R. T. Wilson', category: 'Livestock & Dairy Management', total: 6, avail: 6, isbn: '978-978-842-113-4' },
  { title: 'Sheep and Goat Production in Humid and Sub-Humid Zones', author: 'Prof. L. O. Ngere', category: 'Livestock & Dairy Management', total: 5, avail: 5, isbn: '978-978-842-114-1' },
  { title: 'Pig Production in the Tropics', author: 'J. A. Eusebio', category: 'Livestock & Dairy Management', total: 4, avail: 4, isbn: '978-978-842-115-8' },
  { title: 'Modern Artificial Insemination in Livestock Breeding', author: 'Dr. D. V. C. Osinowo', category: 'Livestock & Dairy Management', total: 3, avail: 3, isbn: '978-978-842-116-5' },
  { title: 'Milk Processing, Quality Testing and Dairy Technology', author: 'Dr. P. O. Fayemi', category: 'Livestock & Dairy Management', total: 4, avail: 4, isbn: '978-978-842-188-2' },
  { title: 'Animal Behaviour and Welfare in Tropical Housing Systems', author: 'Temple Grandin', category: 'Livestock & Dairy Management', total: 3, avail: 3, isbn: '978-978-842-189-9' },

  // Poultry Production & Health
  { title: 'Poultry Production in Warm Wet Climates', author: 'Prof. J. A. Oluyemi & F. A. Roberts', category: 'Poultry Production & Health', total: 7, avail: 7, isbn: '978-978-842-109-7' },
  { title: 'Diseases of Poultry and Avian Pathology', author: 'David E. Swayne', category: 'Poultry Production & Health', total: 4, avail: 4, isbn: '978-978-842-110-3' },
  { title: 'Commercial Broiler & Layer Flock Management', author: 'Donald D. Bell', category: 'Poultry Production & Health', total: 5, avail: 5, isbn: '978-978-842-111-0' },
  { title: 'Incubation & Hatchery Management Practice', author: 'Dr. K. A. Adebambo', category: 'Poultry Production & Health', total: 3, avail: 3, isbn: '978-978-842-112-7' },
  { title: 'Poultry Genetics, Breeding & Egg Quality Standards', author: 'Prof. C. O. N. Ikeobi', category: 'Poultry Production & Health', total: 4, avail: 4, isbn: '978-978-842-190-5' },
  { title: 'Avian Virology & Vaccine Administration in Nigeria', author: 'Dr. P. A. Abdu', category: 'Poultry Production & Health', total: 4, avail: 4, isbn: '978-978-842-191-2' },

  // Pasture & Fodder Agronomy
  { title: 'Tropical Pasture and Fodder Crops', author: 'L. R. Humphreys', category: 'Pasture & Fodder Agronomy', total: 4, avail: 4, isbn: '978-978-842-117-2' },
  { title: 'Forage Conservation, Silage & Haymaking in Nigeria', author: 'Dr. O. S. Onifade', category: 'Pasture & Fodder Agronomy', total: 3, avail: 3, isbn: '978-978-842-118-9' },
  { title: 'Rangeland Ecology & Grazing Systems in Northern Nigeria', author: 'Prof. P. N. De Leeuw', category: 'Pasture & Fodder Agronomy', total: 4, avail: 4, isbn: '978-978-842-119-6' },
  { title: 'Grassland Improvement, Seed Production & Sod Establishment', author: 'Prof. J. T. Amodu', category: 'Pasture & Fodder Agronomy', total: 4, avail: 4, isbn: '978-978-842-192-9' },
  { title: 'Legume-Grass Interactions and Soil Fertility Maintenance', author: 'Dr. E. C. Agishi', category: 'Pasture & Fodder Agronomy', total: 4, avail: 4, isbn: '978-978-842-193-6' },

  // Agricultural Economics & Extension
  { title: 'Agricultural Extension Principles and Practice in Nigeria', author: 'Prof. T. A. Olowu', category: 'Agricultural Economics & Extension', total: 5, avail: 5, isbn: '978-978-842-127-1' },
  { title: 'Farm Management Economics for Agricultural Colleges', author: 'John B. Penson', category: 'Agricultural Economics & Extension', total: 4, avail: 4, isbn: '978-978-842-128-8' },
  { title: 'Agribusiness Entrepreneurship in Animal Agriculture', author: 'Dr. G. B. Ayoola', category: 'Agricultural Economics & Extension', total: 4, avail: 4, isbn: '978-978-842-129-5' },
  { title: 'Agricultural Cooperatives and Rural Finance Systems', author: 'Prof. M. O. Ijere', category: 'Agricultural Economics & Extension', total: 4, avail: 4, isbn: '978-978-842-194-3' },
  { title: 'Agricultural Marketing, Value Chain and Commodity Pricing', author: 'Dr. V. A. Okoruwa', category: 'Agricultural Economics & Extension', total: 4, avail: 4, isbn: '978-978-842-195-0' },
  { title: 'Rural Sociology and Community Mobilization Dynamics', author: 'Prof. J. U. Agbamu', category: 'Agricultural Economics & Extension', total: 4, avail: 4, isbn: '978-978-842-196-7' },

  // General & Basic Sciences
  { title: 'General Studies: Communication in English for Polytechnics', author: 'Dr. S. O. Unoh', category: 'General & Basic Sciences', total: 8, avail: 8, isbn: '978-978-842-134-9' },
  { title: 'General Biology for Agricultural Colleges', author: 'Prof. C. I. C. Ogbonna', category: 'General & Basic Sciences', total: 6, avail: 6, isbn: '978-978-842-135-6' },
  { title: 'Organic & Biological Chemistry Fundamentals', author: 'John McMurry', category: 'General & Basic Sciences', total: 5, avail: 5, isbn: '978-978-842-136-3' },
  { title: 'Citizenship Education & Peace Studies in Nigeria', author: 'Dr. O. A. Falola', category: 'General & Basic Sciences', total: 7, avail: 7, isbn: '978-978-842-137-0' },
  { title: 'Research Methodology and Technical Report Writing', author: 'Prof. B. C. Nworgu', category: 'General & Basic Sciences', total: 5, avail: 5, isbn: '978-978-842-138-7' },
  { title: 'Library Use and Information Literacy Skills', author: 'Dr. Ibrahim Musa', category: 'General & Basic Sciences', total: 6, avail: 6, isbn: '978-978-842-140-0' },
  { title: 'Physics for Agricultural & Environmental Sciences', author: 'Prof. P. N. Okeke', category: 'General & Basic Sciences', total: 5, avail: 5, isbn: '978-978-842-197-4' }
];

export function getCleanBookDocs() {
  return RAW_BOOKS.map((b, idx) => ({
    id: `book_${idx + 1}`,
    title: b.title,
    author: b.author,
    category: b.category,
    isbn: b.isbn,
    totalCopies: b.total,
    availableCopies: b.avail,
    status: 'available',
    condition: 'good',
    shelfLocation: `Stack ${String.fromCharCode(65 + (idx % 6))}-${Math.floor(idx / 6) + 1}`,
    description: `Official academic textbook for ND and HND curricula at FCAHPT Vom.`,
    createdAt: new Date().toISOString()
  }));
}

/**
 * Cleanly seed ONLY the real books and default scoring settings.
 * NO mock patrons, NO mock borrowings, NO mock defaults, NO mock score logs!
 */
export async function seedBooksAndSettings() {
  console.log('Seeding FCAHPT Vom Library Books & Institutional Settings...');

  // 1. Settings (scoring formulas, tiers, loan limits)
  await saveDocument('settings', 'scoring', DEFAULT_SCORING_SETTINGS, true);

  // 2. Books
  const bookDocs = getCleanBookDocs();
  populateLocalCollection('books', bookDocs);

  // If connected to live Firestore, write books and settings into Firestore as well
  if (isConfigured && !forceDemoMode && db) {
    try {
      const writes = [
        { type: 'set', collection: 'settings', id: 'scoring', data: DEFAULT_SCORING_SETTINGS }
      ];

      bookDocs.forEach(b => {
        writes.push({ type: 'set', collection: 'books', id: b.id, data: b });
      });

      // Split into batches of 400 (Firestore max 500 per batch)
      for (let i = 0; i < writes.length; i += 400) {
        await batchWrite(writes.slice(i, i + 400));
      }
      console.log(`Successfully synced ${bookDocs.length} real books to Firestore!`);
    } catch (err) {
      console.warn('Note: Could not sync books to Firestore directly:', err.message);
    }
  }

  return {
    booksCount: bookDocs.length
  };
}

/**
 * Remove all mock data from storage, keeping only books and settings
 */
export function clearMockUserData() {
  if (typeof localStorage === 'undefined') return;
  const mockKeys = [
    'libcredit_db_users',
    'libcredit_db_creditScores',
    'libcredit_db_borrowings',
    'libcredit_db_scoreLogs',
    'libcredit_db_defaults',
    'libcredit_db_disputes',
    'libcredit_current_user'
  ];

  mockKeys.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch (e) {
      // ignore
    }
  });

  console.log('Mock user records, loans, defaults and disputes purged from storage.');
}

/**
 * Backward compatibility alias
 */
export async function seedDemoData() {
  clearMockUserData();
  return await seedBooksAndSettings();
}
