#!/usr/bin/env node

/**
 * This script bundles shared code with API functions for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

// Ensure api/_shared directory exists
const sharedDir = path.join(__dirname, '../api/_shared');
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

// Copy shared/schema.ts to api/_shared/schema.ts
const schemaSource = path.join(__dirname, '../shared/schema.ts');
const schemaDest = path.join(__dirname, '../api/_shared/schema.ts');
fs.copyFileSync(schemaSource, schemaDest);
console.log('✅ Copied shared/schema.ts to api/_shared/schema.ts');

// Read the main API file and update imports
const apiIndexPath = path.join(__dirname, '../api/index.ts');
let apiContent = fs.readFileSync(apiIndexPath, 'utf-8');

// Replace imports from '../shared/schema' to './_shared/schema'
apiContent = apiContent.replace(
  /from ['"]\.\.\/shared\/schema['"]/g,
  "from './_shared/schema'"
);

// Write the updated content back
fs.writeFileSync(apiIndexPath, apiContent);
console.log('✅ Updated imports in api/index.ts');

// Do the same for other API files that might use shared code
const apiFiles = ['simple.ts'];
apiFiles.forEach(file => {
  const filePath = path.join(__dirname, '../api', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(
      /from ['"]\.\.\/shared\/schema['"]/g,
      "from './_shared/schema'"
    );
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated imports in api/${file}`);
  }
});

console.log('🎉 API bundling complete!');