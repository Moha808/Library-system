import { fetchDocument, saveDocument, DEFAULT_SCORING_SETTINGS } from '../firebase/dbAdapter';

const SETTINGS_COLLECTION = 'settings';
const SCORING_DOC_ID = 'scoring';

/**
 * Fetch current scoring settings from Firestore or fallback to system defaults
 */
export async function getScoringSettings() {
  try {
    const doc = await fetchDocument(SETTINGS_COLLECTION, SCORING_DOC_ID);
    if (doc) {
      return { ...DEFAULT_SCORING_SETTINGS, ...doc };
    }
  } catch (error) {
    console.error('Error fetching scoring settings:', error);
  }
  return DEFAULT_SCORING_SETTINGS;
}

/**
 * Save updated scoring rules and tier configurations
 */
export async function updateScoringSettings(newSettings) {
  try {
    const updated = await saveDocument(SETTINGS_COLLECTION, SCORING_DOC_ID, newSettings, true);
    return updated;
  } catch (error) {
    console.error('Error updating scoring settings:', error);
    throw error;
  }
}

/**
 * Reset scoring rules back to FCAHPT Vom standard default model
 */
export async function resetScoringSettings() {
  try {
    const reset = await saveDocument(SETTINGS_COLLECTION, SCORING_DOC_ID, DEFAULT_SCORING_SETTINGS, false);
    return reset;
  } catch (error) {
    console.error('Error resetting scoring settings:', error);
    throw error;
  }
}
