export const PROGRAMMING_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'swift', label: 'Swift' },
  { id: 'php', label: 'PHP' },
];

export const DEFAULT_LANGUAGE_IDS = PROGRAMMING_LANGUAGES.map((language) => language.id);

export const DEFAULT_CODE = {
  javascript: `// Write your solution here
function solve(input) {
  const values = input.trim().split(/\\s+/);
  // Your code here
  return '';
}

console.log(solve(input));`,
  typescript: `// Write your solution here
function solve(input: string): string {
  const values = input.trim().split(/\\s+/);
  // Your code here
  return '';
}

console.log(solve(input));`,
  python: `# Write your solution here
def solve():
    import sys
    data = sys.stdin.read().strip().split()
    # Your code here

if __name__ == '__main__':
    solve()`,
  java: `// Write your solution here
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
  cpp: `// Write your solution here
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Your code here
    return 0;
}`,
  c: `// Write your solution here
#include <stdio.h>

int main(void) {
    // Your code here
    return 0;
}`,
  csharp: `// Write your solution here
using System;
using System.Linq;

public class MainClass {
    public static void Main() {
        string input = Console.In.ReadToEnd();
        string[] values = input.Split((char[])null, StringSplitOptions.RemoveEmptyEntries);
        // Your code here
    }
}`,
  go: `// Write your solution here
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Split(bufio.ScanWords)

    // Your code here
    _ = fmt.Print
}`,
  rust: `// Write your solution here
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let values: Vec<&str> = input.split_whitespace().collect();

    // Your code here
    let _ = values;
}`,
  kotlin: `// Write your solution here
fun main() {
    val input = generateSequence(::readLine).joinToString(" ")
    val values = input.split(Regex("\\\\s+")).filter { it.isNotEmpty() }

    // Your code here
}`,
  ruby: `# Write your solution here
input = STDIN.read
values = input.split

# Your code here
`,
  swift: `// Write your solution here
import Foundation

let input = FileHandle.standardInput.readDataToEndOfFile()
let text = String(data: input, encoding: .utf8) ?? ""
let values = text.split { $0 == " " || $0 == "\\n" || $0 == "\\t" }

// Your code here
`,
  php: `<?php
// Write your solution here
$input = trim(stream_get_contents(STDIN));
$values = preg_split('/\\s+/', $input, -1, PREG_SPLIT_NO_EMPTY);

// Your code here
`,
};

export function emptyStarterCode() {
  return Object.fromEntries(PROGRAMMING_LANGUAGES.map((language) => [language.id, '']));
}

export function getLanguageLabel(languageId) {
  return PROGRAMMING_LANGUAGES.find((language) => language.id === languageId)?.label || languageId;
}

export function pickDefaultLanguage(languages = []) {
  if (languages.includes('javascript')) return 'javascript';
  return languages.find((language) => PROGRAMMING_LANGUAGES.some((item) => item.id === language)) || 'javascript';
}
