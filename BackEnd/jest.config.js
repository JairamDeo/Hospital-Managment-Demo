export default {

    transform: {}, // no transform needed for ESM
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },  
  };

