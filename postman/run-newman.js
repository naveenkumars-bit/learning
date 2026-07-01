const newman = require('newman');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const collectionPath = path.join(__dirname, 'collections', 'api-validation.postman_collection.json');
const environmentPath = path.join(__dirname, 'collections', 'api-validation.postman_environment.json');

console.log('==================================================');
console.log(' Starting Postman API Verification via Newman CI');
console.log(` Collection: ${path.basename(collectionPath)}`);
console.log(` Environment: ${path.basename(environmentPath)}`);
console.log('==================================================\n');

newman.run({
  collection: collectionPath,
  environment: environmentPath,
  reporters: ['cli', 'htmlextra'],
  reporter: {
    htmlextra: {
      export: path.join(reportsDir, 'newman-api-report.html'),
      title: 'SUT API Automation Dashboard Report',
      titleSize: 4,
      showSummaryStep: true,
      showFolderDescription: true,
      timezone: 'Asia/Kolkata'
    }
  }
}, function (err, summary) {
  console.log('\n==================================================');
  if (err || summary.run.failures.length > 0) {
    console.error(' ❌ Newman Test Run FAILED!');
    
    if (summary && summary.run.failures) {
      console.error(` Total Failures: ${summary.run.failures.length}`);
      summary.run.failures.forEach((failure, index) => {
        console.error(`   ${index + 1}. Request: "${failure.source.name}" | Error: "${failure.error.message}"`);
      });
    } else if (err) {
      console.error(` Error: ${err.message}`);
    }
    console.log('==================================================');
    process.exit(1);
  } else {
    console.log(' 🎉 Newman Test Run COMPLETED SUCCESSFUL!');
    console.log(` Report Generated: file:///${reportsDir.replace(/\\/g, '/')}/newman-api-report.html`);
    console.log('==================================================');
    process.exit(0);
  }
});
