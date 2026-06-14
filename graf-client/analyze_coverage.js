const fs = require('fs');
const path = require('path');

const coveragePath = path.join(__dirname, 'coverage/coverage-summary.json');

try {
  const data = fs.readFileSync(coveragePath, 'utf8');
  const coverage = JSON.parse(data);

  const files = Object.keys(coverage).map(file => {
    const stats = coverage[file];
    const statements = stats.statements;
    const uncovered = statements.total - statements.covered;
    return {
      file: file.replace(process.cwd(), ''),
      total: statements.total,
      covered: statements.covered,
      uncovered: uncovered,
      pct: statements.pct
    };
  });

  // Sort by uncovered statements descending
  files.sort((a, b) => b.uncovered - a.uncovered);

  console.log('Top 20 files by uncovered statements:');
  files.slice(0, 20).forEach(f => {
    console.log(`${f.file}: ${f.uncovered} uncovered (${f.pct}%) - Total: ${f.total}`);
  });

} catch (err) {
  console.error('Error reading coverage summary:', err);
}
