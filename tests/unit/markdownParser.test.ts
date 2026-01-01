/**
 * Tests for Markdown Parser
 */

import {
  parseMarkdownHabits,
  validateMarkdownContent,
} from '../../server/src/utils/markdownParser';

describe('markdownParser', () => {
  describe('validateMarkdownContent', () => {
    it('should reject empty content', () => {
      const result = validateMarkdownContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content cannot be empty');
    });

    it('should reject whitespace-only content', () => {
      const result = validateMarkdownContent('   \n   \n   ');
      expect(result.isValid).toBe(false);
    });

    it('should reject content without habits', () => {
      const result = validateMarkdownContent('# Just a header\nNo habits here');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('No habits found');
    });

    it('should accept valid content with habits', () => {
      const result = validateMarkdownContent('# Category\n- My Habit');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parseMarkdownHabits', () => {
    it('should parse simple habits without category', () => {
      const content = `- Habit 1
- Habit 2
- Habit 3`;

      const result = parseMarkdownHabits(content);

      expect(result.habits).toHaveLength(3);
      expect(result.habits[0].name).toBe('Habit 1');
      expect(result.habits[0].categoryName).toBeNull();
      expect(result.categories).toHaveLength(0);
    });

    it('should parse habits with top-level category', () => {
      const content = `# Health
- Exercise
- Drink Water`;

      const result = parseMarkdownHabits(content);

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Health');

      expect(result.habits).toHaveLength(2);
      expect(result.habits[0].name).toBe('Exercise');
      expect(result.habits[0].categoryName).toBe('Health');
    });

    it('should parse habits with subcategories', () => {
      const content = `# Health
## Morning
- Stretch
- Meditation
## Evening
- Wind down
- Journal`;

      const result = parseMarkdownHabits(content);

      expect(result.categories).toHaveLength(3);
      expect(result.categories[0].name).toBe('Health');
      expect(result.categories[1].name).toBe('Health > Morning');
      expect(result.categories[2].name).toBe('Health > Evening');

      expect(result.habits).toHaveLength(4);
      expect(result.habits[0].categoryName).toBe('Health > Morning');
      expect(result.habits[2].categoryName).toBe('Health > Evening');
    });

    it('should handle multiple top-level categories', () => {
      const content = `# Fitness
- Run
- Gym

# Nutrition
- Clean Eating
- No Snacks`;

      const result = parseMarkdownHabits(content);

      expect(result.categories).toHaveLength(2);
      expect(result.habits).toHaveLength(4);
      expect(result.habits[0].categoryName).toBe('Fitness');
      expect(result.habits[2].categoryName).toBe('Nutrition');
    });

    it('should handle asterisk bullets', () => {
      const content = `* Habit with asterisk
* Another one`;

      const result = parseMarkdownHabits(content);

      expect(result.habits).toHaveLength(2);
      expect(result.habits[0].name).toBe('Habit with asterisk');
    });

    it('should skip empty lines and comments', () => {
      const content = `# Category

- Habit 1
// This is a comment
- Habit 2

<!-- HTML comment -->
- Habit 3`;

      const result = parseMarkdownHabits(content);

      expect(result.habits).toHaveLength(3);
      expect(result.stats.skippedLines).toBeGreaterThan(0);
    });

    it('should track sort order', () => {
      const content = `# Cat1
- Habit A
# Cat2
- Habit B
- Habit C`;

      const result = parseMarkdownHabits(content);

      expect(result.categories[0].sortOrder).toBe(0);
      expect(result.categories[1].sortOrder).toBe(1);

      expect(result.habits[0].sortOrder).toBe(0);
      expect(result.habits[1].sortOrder).toBe(1);
      expect(result.habits[2].sortOrder).toBe(2);
    });

    it('should handle complex sample file format', () => {
      const content = `# Fuel
## Timing
- Fasting Day (14+ hrs)
- No Food After 11 PM
## Quality
- Clean Eating
- No Fast Food

# Medicine
## Pills
- Morning Pills
- Evening Pills
## Supplements
- Creatine`;

      const result = parseMarkdownHabits(content);

      expect(result.categories.length).toBeGreaterThanOrEqual(5);
      expect(result.habits.length).toBe(7);

      // Check subcategory assignment
      const fastingHabit = result.habits.find(h => h.name === 'Fasting Day (14+ hrs)');
      expect(fastingHabit?.categoryName).toBe('Fuel > Timing');

      const creatineHabit = result.habits.find(h => h.name === 'Creatine');
      expect(creatineHabit?.categoryName).toBe('Medicine > Supplements');
    });

    it('should report stats correctly', () => {
      const content = `# Category
- Habit 1
- Habit 2

Some random text
- Habit 3`;

      const result = parseMarkdownHabits(content);

      expect(result.stats.habitsFound).toBe(3);
      expect(result.stats.categoriesFound).toBe(1);
      expect(result.stats.totalLines).toBe(7);
    });

    it('should not duplicate categories', () => {
      const content = `# Fitness
- Running
# Nutrition
- Eating
# Fitness
- Gym`;

      const result = parseMarkdownHabits(content);

      // Fitness should only appear once
      const fitnessCategories = result.categories.filter(c => c.name === 'Fitness');
      expect(fitnessCategories).toHaveLength(1);
    });

    it('should handle empty habit names gracefully', () => {
      const content = `# Category
-
- Valid Habit`;

      const result = parseMarkdownHabits(content);

      expect(result.habits).toHaveLength(1);
      expect(result.habits[0].name).toBe('Valid Habit');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
