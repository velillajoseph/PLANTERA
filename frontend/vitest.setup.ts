// vitest.setup.ts
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with all jest-dom matchers
expect.extend(matchers);
