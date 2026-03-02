import { describe, it, expect } from 'vitest';
import { DISEASE_DB } from '../services/DiseaseDatabase';

describe('Disease Database', () => {
    it('should have a valid database structure', () => {
        expect(DISEASE_DB).toBeDefined();
        expect(Object.keys(DISEASE_DB).length).toBeGreaterThan(0);
    });

    it('should have required fields for all diseases', () => {
        Object.values(DISEASE_DB).forEach(disease => {
            expect(disease.name).toBeDefined();
            expect(disease.localName).toBeDefined();
            expect(disease.description).toBeDefined();
            expect(disease.severity).toBeDefined();
            expect(['Low', 'Medium', 'High']).toContain(disease.severity);
        });
    });

    it('should separate Cotton and Soybean diseases correctly', () => {
        const cottonDiseases = Object.keys(DISEASE_DB).filter(k => k.startsWith('Cotton'));
        const soybeanDiseases = Object.keys(DISEASE_DB).filter(k => k.startsWith('Soybean'));

        expect(cottonDiseases.length).toBeGreaterThan(0);
        expect(soybeanDiseases.length).toBeGreaterThan(0);
    });
});
