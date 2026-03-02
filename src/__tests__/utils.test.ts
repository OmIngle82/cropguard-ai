import { describe, it, expect } from 'vitest';

describe('Basic Math', () => {
    it('should add two numbers correctly', () => {
        expect(1 + 1).toBe(2);
    });
});

describe('Date Formatting', () => {
    it('should format dates correctly', () => {
        const date = new Date('2023-01-01T00:00:00.000Z');
        // Simple check to ensure testing environment works
        expect(date.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });
});
