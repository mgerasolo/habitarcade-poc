/**
 * Markdown Parser for Bulk Habit Import
 *
 * Parses a specific markdown format to extract categories and habits:
 *
 * Format:
 * # CategoryName
 * ## Subcategory (becomes part of category name: "CategoryName > Subcategory")
 * - HabitName
 *
 * Lines starting with # create categories
 * Lines starting with ## create subcategories within the current category
 * Lines starting with - are habits
 */

export interface ParsedHabit {
  name: string;
  categoryName: string | null;
  sortOrder: number;
}

export interface ParsedCategory {
  name: string;
  sortOrder: number;
}

export interface ParseResult {
  categories: ParsedCategory[];
  habits: ParsedHabit[];
  errors: string[];
  stats: {
    totalLines: number;
    categoriesFound: number;
    habitsFound: number;
    skippedLines: number;
  };
}

/**
 * Parse markdown content into categories and habits
 *
 * @param content - Markdown content to parse
 * @returns ParseResult with categories, habits, and parsing stats
 */
export function parseMarkdownHabits(content: string): ParseResult {
  const lines = content.split('\n');
  const categories: ParsedCategory[] = [];
  const habits: ParsedHabit[] = [];
  const errors: string[] = [];
  const categorySet = new Set<string>();

  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  let categoryOrder = 0;
  let habitOrder = 0;
  let skippedLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('<!--')) {
      skippedLines++;
      continue;
    }

    // Handle headers
    if (line.startsWith('#')) {
      // Check header level
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerText = headerMatch[2].trim();

        if (level === 1) {
          // Top-level category
          currentCategory = headerText;
          currentSubcategory = null;

          if (!categorySet.has(currentCategory)) {
            categorySet.add(currentCategory);
            categories.push({
              name: currentCategory,
              sortOrder: categoryOrder++,
            });
          }
        } else if (level === 2) {
          // Subcategory - combine with parent category
          currentSubcategory = headerText;

          // Create combined category name
          const combinedName = currentCategory
            ? `${currentCategory} > ${headerText}`
            : headerText;

          if (!categorySet.has(combinedName)) {
            categorySet.add(combinedName);
            categories.push({
              name: combinedName,
              sortOrder: categoryOrder++,
            });
          }
        }
        // Deeper headers are treated as subcategories too
        continue;
      }
    }

    // Handle list items (habits)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const habitName = line.substring(2).trim();

      if (!habitName) {
        errors.push(`Line ${lineNumber}: Empty habit name`);
        skippedLines++;
        continue;
      }

      // Determine which category this habit belongs to
      let categoryName: string | null = null;
      if (currentSubcategory && currentCategory) {
        categoryName = `${currentCategory} > ${currentSubcategory}`;
      } else if (currentCategory) {
        categoryName = currentCategory;
      }

      habits.push({
        name: habitName,
        categoryName,
        sortOrder: habitOrder++,
      });
      continue;
    }

    // Any other non-empty line is skipped
    skippedLines++;
  }

  return {
    categories,
    habits,
    errors,
    stats: {
      totalLines: lines.length,
      categoriesFound: categories.length,
      habitsFound: habits.length,
      skippedLines,
    },
  };
}

/**
 * Validate markdown content before parsing
 *
 * @param content - Markdown content to validate
 * @returns Validation result with success status and any errors
 */
export function validateMarkdownContent(content: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content || typeof content !== 'string') {
    errors.push('Content is required and must be a string');
    return { isValid: false, errors };
  }

  if (content.trim().length === 0) {
    errors.push('Content cannot be empty');
    return { isValid: false, errors };
  }

  // Check for at least one habit
  const lines = content.split('\n');
  const hasHabit = lines.some(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('- ') || trimmed.startsWith('* ');
  });

  if (!hasHabit) {
    errors.push('No habits found. Habits should be on lines starting with "- "');
    return { isValid: false, errors };
  }

  return { isValid: errors.length === 0, errors };
}
