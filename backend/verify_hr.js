import { getWeeklyRestingHR } from './src/services/analytics/hr.service.js';

const runTests = () => {
    console.log("Starting Verification Tests for getWeeklyRestingHR...");

    // Test 1: Sorting and Last 7 entries
    try {
        const logs = [
            { date: "2026-03-24", bpm: 60 },
            { date: "2026-03-23", bpm: 60 },
            { date: "2026-03-22", bpm: 60 },
            { date: "2026-03-21", bpm: 60 },
            { date: "2026-03-20", bpm: 60 },
            { date: "2026-03-19", bpm: 60 },
            { date: "2026-03-18", bpm: 100 }, // This is the 8th log (oldest) - should be ignored if last 7 are taken
            { date: "2026-03-25", bpm: 70 }, // Latest log
        ];
        // Sorted: 18, 19, 20, 21, 22, 23, 24, 25
        // Last 7: 19, 20, 21, 22, 23, 24, 25
        // Avg: (60*6 + 70) / 7 = 430 / 7 = 61.42 -> 61
        const result = getWeeklyRestingHR(logs);
        if (result === 61) {
            console.log("PASS: Sorting and Last 7 entries");
        } else {
            console.log(`FAIL: Sorting/Last 7 entries. Expected 61, got ${result}`);
        }
    } catch (e) {
        console.log("FAIL: Sorting/Last 7 entries threw error:", e.message);
    }

    // Test 2: Invalid bpm ignored
    try {
        const logs = [
            { date: "2026-03-19", bpm: 60 },
            { date: "2026-03-20", bpm: null }, // Invalid
            { date: "2026-03-21", bpm: 60 },
            { date: "2026-03-22", bpm: "60" }, // Invalid if not a number (my filter checks typeof number)
            { date: "2026-03-23", bpm: 60 },
            { date: "2026-03-24", bpm: 60 },
            { date: "2026-03-25", bpm: 60 },
            { date: "2026-03-26", bpm: 60 },
            { date: "2026-03-27", bpm: 70 },
        ];
        // Valid: 19, 21, 23, 24, 25, 26, 27 (7 logs)
        // Avg: (60*6 + 70) / 7 = 61.42 -> 61
        const result = getWeeklyRestingHR(logs);
        if (result === 61) {
            console.log("PASS: Invalid BPM ignored");
        } else {
            console.log(`FAIL: Invalid BPM ignored. Expected 61, got ${result}`);
        }
    } catch (e) {
        console.log("FAIL: Invalid BPM ignored threw error:", e.message);
    }

    // Test 3: Error if < 7 valid entries
    try {
        const logs = [
            { date: "2026-03-24", bpm: 60 },
            { date: "2026-03-25", bpm: 60 },
        ];
        getWeeklyRestingHR(logs);
        console.log("FAIL: Error if < 7 valid entries (should have thrown)");
    } catch (e) {
        console.log("PASS: Error if < 7 valid entries");
    }

    console.log("Verification Tests Completed.");
};

runTests();
