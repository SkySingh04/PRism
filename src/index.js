class LoveCalculator {
    constructor() {
        this.loveScores = new Map();
    }

    // Calculate love score between two names
    calculateLove(name1, name2) {
        const key = [name1.toLowerCase(), name2.toLowerCase()].sort().join('-');
        
        // Return cached result if exists
        if (this.loveScores.has(key)) {
            return this.loveScores.get(key);
        }

        // Calculate base score from names
        let score = this.generateLoveScore(name1, name2);
        
        // Add some randomness but keep it consistent for same pairs
        score = (score + this.seedRandom(key)) % 101;
        
        this.loveScores.set(key, score);
        return score;
    }

    // Generate initial score based on names
    generateLoveScore(name1, name2) {
        const combined = (name1 + name2).toLowerCase();
        let score = 0;
        
        // Count love letters
        const loveLetters = 'love'.split('');
        loveLetters.forEach(letter => {
            score += (combined.split(letter).length - 1) * 10;
        });

        // Add length factor
        score += (name1.length + name2.length) * 2;
        
        return score;
    }

    // Generate consistent random number for same inputs
    seedRandom(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) % 20;
    }

    // Get compatibility message
    getMessage(score) {
        if (score >= 80) return "Perfect Match! 💘";
        if (score >= 60) return "Very Compatible! 💖";
        if (score >= 40) return "There's Potential! 💕";
        if (score >= 20) return "Friends Maybe? 💝";
        return "Keep Looking! 💔";
    }
}

// Example usage
const loveCalc = new LoveCalculator();
const name1 = "Romeo";
const name2 = "Juliet";
const score = loveCalc.calculateLove(name1, name2);
console.log(`Love compatibility between ${name1} and ${name2}: ${score}%`);
console.log(loveCalc.getMessage(score));