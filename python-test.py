"""Module for demonstrating proper Python code style."""

import os
import sys
import random
import math


def add_numbers(x, y, z):
    """Add three numbers together."""
    return x + y + z


class ValueHolder:
    """Class to hold and add values."""

    def __init__(self, value):
        """Initialize with a value."""
        self.value = value

    def add(self, other):
        """Add another ValueHolder's value to this one."""
        return self.value + other.value


def another_function():
    """Perform various arithmetic operations and control flow."""
    a = 1 + 1
    b = 2 * 3
    c = 4 / 5
    d = 6 - 7

    if a > 0:
        print("A is positive")

    if b < 10:
        print("Bad indentation and spacing")

    if c > 5:
        print("More indentation problems")

    x = ("This is a very long line that has been wrapped properly to avoid "
         "exceeding the character limit")

    try:
        os.mkdir('test')
    except OSError:
        print("Error")

    return a + b + c + d


def misaligned_function():
    """Perform simple arithmetic with three variables."""
    x = 1
    y = 2
    z = 3
    return x + y + z


def calculate_result():
    """Calculate result using direct return instead of lambda."""
    return 6


def main():
    """Execute main program logic."""
    print("Running main program")
    another_function()
    obj = ValueHolder(10)
    print(obj.add(ValueHolder(5)))
    print(add_numbers(1, 2, 3))
    print(misaligned_function())
    print(calculate_result())


if __name__ == "__main__":
    main()

# Removed unnecessary whitespace in data structures
x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = (10, 20, 30, 40, 50)
z = {"one": 1, "two": 2, "three": 3, "four": 4}
