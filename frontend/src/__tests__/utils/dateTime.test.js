import {
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  parseTime,
  calculateAge,
  isDateInRange,
  getDaysBetween,
  getWeeksBetween,
  getMonthsBetween
} from '../../utils/dateTime';

describe('Date and Time Utils', () => {
  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('01/15/2024');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
      expect(formatDate(date, 'MMMM d, yyyy')).toBe('January 15, 2024');
    });

    it('handles invalid dates', () => {
      expect(() => formatDate('invalid-date')).toThrow();
    });
  });

  describe('Time Formatting', () => {
    it('formats times correctly', () => {
      const time = new Date('2024-01-15T14:30:00');
      expect(formatTime(time)).toBe('2:30 PM');
      expect(formatTime(time, 'HH:mm')).toBe('14:30');
      expect(formatTime(time, 'h:mm a')).toBe('2:30 PM');
    });

    it('handles invalid times', () => {
      expect(() => formatTime('invalid-time')).toThrow();
    });
  });

  describe('DateTime Formatting', () => {
    it('formats date and time together', () => {
      const dateTime = new Date('2024-01-15T14:30:00');
      expect(formatDateTime(dateTime)).toBe('01/15/2024 2:30 PM');
      expect(formatDateTime(dateTime, 'yyyy-MM-dd HH:mm')).toBe('2024-01-15 14:30');
    });

    it('handles timezone differences', () => {
      const dateTime = new Date('2024-01-15T14:30:00Z');
      const formatted = formatDateTime(dateTime);
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} [AP]M$/);
    });
  });

  describe('Date Parsing', () => {
    it('parses various date formats', () => {
      expect(parseDate('2024-01-15')).toBeInstanceOf(Date);
      expect(parseDate('01/15/2024')).toBeInstanceOf(Date);
      expect(parseDate('January 15, 2024')).toBeInstanceOf(Date);
    });

    it('handles invalid date strings', () => {
      expect(() => parseDate('invalid')).toThrow();
    });
  });

  describe('Time Parsing', () => {
    it('parses various time formats', () => {
      expect(parseTime('14:30')).toBeInstanceOf(Date);
      expect(parseTime('2:30 PM')).toBeInstanceOf(Date);
      expect(parseTime('2:30PM')).toBeInstanceOf(Date);
    });

    it('handles invalid time strings', () => {
      expect(() => parseTime('invalid')).toThrow();
    });
  });

  describe('Age Calculation', () => {
    it('calculates age correctly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      expect(calculateAge(birthDate)).toBe(25);
    });

    it('handles edge cases around birthdays', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      birthDate.setDate(birthDate.getDate() + 1);
      expect(calculateAge(birthDate)).toBe(24);
    });
  });

  describe('Date Range Checks', () => {
    it('checks if date is within range', () => {
      const date = new Date('2024-01-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(true);
      expect(isDateInRange(new Date('2024-02-01'), start, end)).toBe(false);
    });

    it('handles same-day ranges', () => {
      const date = new Date('2024-01-15');
      expect(isDateInRange(date, date, date)).toBe(true);
    });
  });

  describe('Time Period Calculations', () => {
    it('calculates days between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');
      expect(getDaysBetween(start, end)).toBe(14);
    });

    it('calculates weeks between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');
      expect(getWeeksBetween(start, end)).toBe(2);
    });

    it('calculates months between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-03-01');
      expect(getMonthsBetween(start, end)).toBe(2);
    });

    it('handles negative date ranges', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-01');
      expect(getDaysBetween(start, end)).toBe(-14);
    });
  });
});
