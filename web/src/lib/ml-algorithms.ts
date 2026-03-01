/**
 * A lightweight ML module for client-side analytical simulations.
 */

// Basic K-Means Clustering for Transaction Segmentation
export function kMeansClustering(data: number[][], k: number, maxIterations = 50) {
    if (data.length === 0) return { centroids: [], assignments: [] };

    const dimensions = data[0].length;
    // Initialize centroids to random data points
    let centroids = Array.from({ length: k }, () => {
        const randomIdx = Math.floor(Math.random() * data.length);
        return [...data[randomIdx]];
    });

    let assignments = new Array(data.length).fill(-1);
    let changed = true;
    let iterations = 0;

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        // Assignment step
        for (let i = 0; i < data.length; i++) {
            let minDist = Infinity;
            let closestCluster = -1;

            for (let j = 0; j < k; j++) {
                const dist = euclideanDistance(data[i], centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    closestCluster = j;
                }
            }

            if (assignments[i] !== closestCluster) {
                assignments[i] = closestCluster;
                changed = true;
            }
        }

        // Update step
        const newCentroids = Array.from({ length: k }, () => new Array(dimensions).fill(0));
        const counts = new Array(k).fill(0);

        for (let i = 0; i < data.length; i++) {
            const cluster = assignments[i];
            counts[cluster]++;
            for (let d = 0; d < dimensions; d++) {
                newCentroids[cluster][d] += data[i][d];
            }
        }

        for (let j = 0; j < k; j++) {
            if (counts[j] > 0) {
                for (let d = 0; d < dimensions; d++) {
                    newCentroids[j][d] /= counts[j];
                }
            } else {
                // If a cluster is empty, randomly assign a new point
                newCentroids[j] = [...data[Math.floor(Math.random() * data.length)]];
            }
        }
        centroids = newCentroids;
    }

    return { centroids, assignments, iterations };
}

function euclideanDistance(a: number[], b: number[]) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

// Simple Logistic Regression Mock for Fraud Probability Simulation
// Evaluates how rule stringency affects predicted probabilities
export function simulateFraudProbability(
    amount: number,
    hour: number,
    historicalFailures: number,
    deltaThreshold: number
) {
    // Pre-calculated weights (simulated coefficients from historical training)
    const w0 = -4.5; // Intercept (low base probability)
    const wAmount = 0.0001;
    const wHourNight = (hour < 6 || hour > 22) ? 1.5 : -0.5;
    const wFailures = 0.8;

    // Logit linear combination
    const logit = w0 + (amount * wAmount) + wHourNight + (historicalFailures * wFailures);

    // Sigmoid activation
    const baseProbability = 1 / (1 + Math.exp(-logit));

    // Delta threshold represents internal rule tightening (> 0 tightens, < 0 loosens)
    // A tighter rule shifts the apparent probability higher, causing more blocks
    const effectiveProbability = Math.min(0.99, Math.max(0.01, baseProbability * (1 + deltaThreshold / 100)));

    return {
        probability: effectiveProbability,
        isBlocked: effectiveProbability > 0.65 // Hard decision boundary
    };
}
