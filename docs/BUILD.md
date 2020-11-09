# Build

Use Notepad++ 
For js folder only

1. Replace multi-line comments: /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/
With empty string:

2. Replace single-line comments: //\s+.*\r\n\s+
With empty string:

3. Replace console.log statements: ^\s*console.log.*$\r\n
With empty string:

4. Replace multiple empty lines: ^(\s*\r\n){2,}
With one empty line: \r\n

5. Add back multi-line comment at top of each file

6. Check background.js STORAGE_DEFAULT_VALUES. Some code was removed because of multi-line comments replacement due to the xpath rule

7. Follow instructions in infy-scroll.js and change manifest.json to reference the infy-scroll.js content script