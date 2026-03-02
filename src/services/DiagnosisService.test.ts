import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { loadModel, classifyImage } from './DiagnosisService';

vi.mock('@tensorflow/tfjs', () => {
    const tensorMethods = {
        resizeBilinear: vi.fn(() => tensorMethods),
        toFloat: vi.fn(() => tensorMethods),
        div: vi.fn(() => tensorMethods),
        expandDims: vi.fn(() => tensorMethods),
        dataSync: vi.fn(() => new Float32Array([0.1, 0.8, 0.05, 0.05, 0, 0])),
    };

    return {
        loadLayersModel: vi.fn(),
        loadGraphModel: vi.fn(),
        tidy: (fn: any) => fn(),
        browser: {
            fromPixels: vi.fn(() => tensorMethods),
        },
        scalar: vi.fn(() => 'scalar_mock'),
        zeros: vi.fn(() => tensorMethods),
    };
});

vi.mock('@tensorflow-models/mobilenet', () => ({
    load: vi.fn(),
}));

describe('DiagnosisService', () => {
    // Define stable mock objects
    const mockCustomModel = {
        predict: vi.fn(),
    };

    const mockGatekeeperModel = {
        classify: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default behaviors
        mockCustomModel.predict.mockReturnValue({
            dataSync: () => new Float32Array([0.1, 0.8, 0.05, 0.05, 0, 0]),
        });

        mockGatekeeperModel.classify.mockResolvedValue([{ className: 'leaf', probability: 0.9 }]);

        (tf.loadLayersModel as any).mockResolvedValue(mockCustomModel);
        (mobilenet.load as any).mockResolvedValue(mockGatekeeperModel);
    });

    it('should load models successfully', async () => {
        const result = await loadModel();
        expect(result).toHaveProperty('customModel');
        expect(tf.loadLayersModel).toHaveBeenCalled();
        expect(mobilenet.load).toHaveBeenCalled();
    });

    it('should identify Cotton Healthy correctly', async () => {
        await loadModel();
        // Classes: Red_Leaf_Curl, Healthy, ...
        // Index 1 is Cotton_Healthy
        mockCustomModel.predict.mockReturnValue({
            dataSync: () => new Float32Array([0.05, 0.9, 0.01, 0.01, 0.01, 0.02]),
        });

        const mockImg = document.createElement('img');
        const result = await classifyImage(mockImg);

        expect(result.crop).toBe('Cotton');
        expect(result.disease).toContain('Healthy');
    });

    it('should return Not_A_Plant if Gatekeeper detects blocked item', async () => {
        await loadModel();
        mockGatekeeperModel.classify.mockResolvedValue([{ className: 'monitor', probability: 0.9 }]); // Blocked keyword

        const mockImg = document.createElement('img');
        const result = await classifyImage(mockImg);

        expect(result.crop).toBe('Not_A_Plant');
    });

    it('should return Other if Gatekeeper detects conflict crop (e.g. Corn)', async () => {
        await loadModel();
        mockGatekeeperModel.classify.mockResolvedValue([{ className: 'corn', probability: 0.9 }]); // Conflict keyword

        const mockImg = document.createElement('img');
        const result = await classifyImage(mockImg);

        expect(result.crop).toBe('Other');
    });

    it('should handle low confidence predictions as Other', async () => {
        await loadModel();
        // All low probabilities
        mockCustomModel.predict.mockReturnValue({
            dataSync: () => new Float32Array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
        });

        const mockImg = document.createElement('img');
        const result = await classifyImage(mockImg);

        expect(result.crop).toBe('Other');
        expect(result.cropConfidence).toBeLessThan(0.6);
    });
});
