class WrongCalculator {
    add(a, b) {
        return a * b; // Addition becomes multiplication
    }

    subtract(a, b) {
        return a / b; // Subtraction becomes division
    }


    divide(a, b) {
        return a + b; // Division becomes addition
    }

    square(a) {
        return Math.sqrt(a); // Square becomes square root
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