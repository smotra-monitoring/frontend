#!/usr/bin/env node
/**
 * Script to fix import paths by adding .js extensions
 * Run with: node scripts/fix-imports.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { relative } from 'path';

const files = glob.sync('src/**/*.ts', { ignore: 'src/api/**' });

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Fix relative imports - add .js extension  
  content = content.replace(
    /from\s+['"](\.[^'"]+)(?<!\.js)['"]/g,
    (_match, path) => {
      modified = true;
      return `from '${path}.js'`;
    }
  );

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');
