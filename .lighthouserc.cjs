// Baseline-only Lighthouse CI. Runs against public, unauthenticated,
 // locally assembled Pages files on the GitHub runner (no student data).
module.exports = {
  ci: {
    collect: {
      staticDistDir: './site',
      url: ['http://localhost/index.html'],
      numberOfRuns: 2,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        maxWaitForLoad: 45000,
      },
    },
    // First establish a baseline rather than fail the build on unknown scores.
    // After reviewing actual results, promote stable targets to 'error'.
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    // Never upload internal run reports to Lighthouse's public temp storage.
    // Artifacts are only the public homepage and contain no authenticated state.
    upload: {
      target: 'filesystem',
      outputDir: './.lhci-public-reports',
    },
  },
};
