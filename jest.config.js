/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  // اختبارات المهام اليومية الثابتة منطق دالّي (لا تحتاج قاعدة بيانات).
  // اختبارات portal-r القديمة تحتاج قاعدة بيانات حيّة لذا نستثنيها افتراضياً.
  testPathIgnorePatterns: ['/node_modules/', '/src/tests/portal-r/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
