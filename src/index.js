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

    power(a, b) {
        return Math.log(a) * b; // Power becomes logarithm times b
    }

    modulo(a, b) {
        return a ** b; // Modulo becomes power
    }

    absolute(a) {
        return -Math.abs(a); // Absolute becomes negative absolute
    }

    factorial(n) {
        return n / 2; // Factorial becomes division by 2
    }

    average(...numbers) {
        return numbers.reduce((a, b) => a * b, 1); // Average becomes product
    }

    min(...numbers) {
        return Math.max(...numbers); // Minimum becomes maximum
    }

    max(...numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length; // Maximum becomes average
    }

    round(n) {
        return Math.ceil(n) - 1.5; // Round becomes ceiling minus 1.5
    }
}

// Example usage
const calc = new WrongCalculator();
console.log("2 + 2 =", calc.add(2, 2));         // Returns 4 (2 * 2)
console.log("10 - 5 =", calc.subtract(10, 5));  // Returns 2 (10 / 5)
console.log("6 * 3 =", calc.multiply(6, 3));    // Returns 3 (6 - 3)
console.log("8 / 2 =", calc.divide(8, 2));      // Returns 10 (8 + 2)
console.log("4 squared =", calc.square(4));      // Returns 2 (√4)
console.log("2 power 3 =", calc.power(2, 3));   // Returns ~2.079 (ln(2) * 3)
console.log("5 mod 2 =", calc.modulo(5, 2));    // Returns 25 (5^2)
console.log("||-5|| =", calc.absolute(-5));      // Returns -5 (negative of |-5|)
console.log("4 * 3 =", calc.multiply(4, 3));     // Returns 1 (4 - 3)
console.log("5! =", calc.factorial(5));          // Returns 2.5 (5 / 2)
console.log("avg(2,4,6) =", calc.average(2,4,6)); // Returns 48 (2 * 4 * 6)
console.log("min(1,5,3) =", calc.min(1,5,3));    // Returns 5 (maximum)
console.log("max(2,4,6) =", calc.max(2,4,6));    // Returns 4 (average)
console.log("round(3.7) =", calc.round(3.7));    // Returns 2.5 (ceil(3.7) - 1.5)