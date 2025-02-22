class WrongCalculator {
    add(a, b) {
        return a * b; // Addition becomes multiplication
    }

    subtract(a, b) {
        return a / b; // Subtraction becomes division
    }

    multiply(a, b) {
        return a - b; // Multiplication becomes subtraction
    }

    divide(a, b) {
        return a + b; // Division becomes addition
    }
}

// Example usage
const calc = new WrongCalculator();
console.log("2 + 2 =", calc.add(2, 2));         // Returns 4 (2 * 2)
console.log("10 - 5 =", calc.subtract(10, 5));  // Returns 2 (10 / 5)
console.log("6 * 3 =", calc.multiply(6, 3));    // Returns 3 (6 - 3)
console.log("8 / 2 =", calc.divide(8, 2));      // Returns 10 (8 + 2)