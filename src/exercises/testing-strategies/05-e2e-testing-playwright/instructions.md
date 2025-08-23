# End-to-End Testing with Playwright

**Difficulty**: ⭐⭐⭐⭐⭐ (90 minutes)

## Learning Objectives

By completing this exercise, you will master:

- **Playwright Test Framework**: Setting up and writing comprehensive E2E tests with modern tools
- **Page Object Model**: Organizing test code with maintainable page object patterns
- **Test Isolation**: Ensuring tests run independently without interference
- **Cross-browser Testing**: Testing applications across different browsers and devices
- **Parallel Execution**: Running tests efficiently with parallel execution strategies
- **API Testing Integration**: Combining UI and API testing for complete coverage
- **Visual Testing**: Implementing screenshot testing and visual regression detection

## Overview

End-to-end (E2E) testing validates complete user workflows by testing the application as a whole system. This exercise focuses on Playwright, a modern E2E testing framework that provides powerful automation capabilities across multiple browsers.

You'll learn to test complex user flows, implement the Page Object Model for maintainable tests, and use advanced Playwright features like tracing, parallel execution, and API testing.

## Key Concepts

### 1. Playwright Test Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### 2. Page Object Model Pattern
```typescript
// pages/LoginPage.ts
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  private usernameInput = () => this.page.getByTestId('username-input');
  private passwordInput = () => this.page.getByTestId('password-input');
  private loginButton = () => this.page.getByTestId('login-button');
  private errorMessage = () => this.page.getByTestId('error-message');

  // Actions
  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
  }

  // Assertions
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage()).toContainText(message);
  }
}
```

### 3. E2E Test Examples
```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow', () => {
  test('successful admin login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await loginPage.expectLoginSuccess();
    
    // Verify admin features are available
    await expect(page.getByTestId('admin-link')).toBeVisible();
  });

  test('failed login shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('invalid', 'invalid');
    await loginPage.expectLoginError('Invalid credentials');
  });
});
```

### 4. API Testing Integration
```typescript
test('shopping cart integrates with backend API', async ({ page, request }) => {
  // Setup user via API
  const user = await request.post('/api/users', {
    data: { username: 'testuser', email: 'test@example.com' }
  });

  // Login through UI
  await page.goto('/login');
  await page.getByTestId('username-input').fill('testuser');
  await page.getByTestId('password-input').fill('password');
  await page.getByTestId('login-button').click();

  // Verify cart synchronization
  await page.goto('/cart');
  const cartItems = await request.get('/api/cart');
  const uiItems = await page.getByTestId('cart-item').count();
  
  expect(cartItems.length).toBe(uiItems);
});
```

## Your Tasks

### Task 1: Implement CartProvider Context
Complete the shopping cart state management:

```typescript
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize and manage cart state
  // Implement all cart operations with proper state updates
};
```

**Requirements:**
- Initialize `items` state as empty array of `CartItem[]`
- Implement `addToCart` function (handle existing items by updating quantity)
- Implement `removeFromCart` function to remove items by product ID
- Implement `updateQuantity` function with validation (min 1, max stock)
- Implement `clearCart` function to empty the cart
- Implement `getTotalPrice` calculation across all items
- Implement `getTotalItems` count across all quantities

### Task 2: Create LoginFlow Component
Build a comprehensive authentication flow:

```typescript
export const LoginFlow: React.FC = () => {
  // Complete login workflow with validation and error handling
};
```

**Requirements:**
- Form with username and password fields
- Client-side validation (required fields, minimum lengths)
- Loading state during authentication
- Success/error message display
- Redirect to dashboard on successful login
- "Forgot Password" and "Sign Up" links
- Proper accessibility attributes and test IDs

### Task 3: Build ShoppingCart Component
Create a full-featured shopping cart interface:

```typescript
export const ShoppingCart: React.FC = () => {
  // Complete shopping cart with item management
};
```

**Requirements:**
- Display all cart items with product details (name, price, quantity)
- Quantity controls (increase/decrease buttons) with stock validation
- Remove item functionality with confirmation
- Real-time total price calculation and display
- Empty cart state with "Continue Shopping" link
- Checkout button that navigates to checkout process
- Cart summary with item count and total

### Task 4: Implement AdminDashboard Component
Build an admin interface with role-based access:

```typescript
export const AdminDashboard: React.FC = () => {
  // Admin dashboard with management features
};
```

**Requirements:**
- Verify admin role using `useAuth` hook
- Display key metrics (total users, sales, products)
- User management section (list users, change roles)
- Product management interface (add, edit, delete products)
- System settings panel
- Access denied message for non-admin users
- Loading states for data fetching

### Task 5: Create ReportGenerator Component
Build a complex report generation workflow:

```typescript
export const ReportGenerator: React.FC = () => {
  // Report generation with progress tracking
};
```

**Requirements:**
- Report type selection (Sales, Inventory, Users)
- Date range picker for report parameters
- Generate button with loading state
- Progress indicator during report generation
- Generated reports list with download links
- Export format options (PDF, CSV, Excel)
- Report status tracking (pending, generating, completed, failed)
- Error handling and retry functionality

### Task 6: Implement Utility Hooks
Create hooks that support E2E testing scenarios:

```typescript
export const usePageTitle = (title: string) => {
  // Update document title dynamically
};

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // Persistent state management
};

export const useApiCall = <T>(url: string) => {
  // API integration with loading states
};
```

**Requirements:**
- `usePageTitle`: Update `document.title` on mount, cleanup on unmount
- `useLocalStorage`: Read/write to localStorage with JSON serialization
- `useApiCall`: Fetch data with loading, error states, and refetch capability

## E2E Testing Best Practices

### 1. Page Object Model Implementation
```typescript
// pages/ShoppingCartPage.ts
export class ShoppingCartPage {
  constructor(private page: Page) {}

  // Locators using data-testid for stability
  private cartItems = () => this.page.getByTestId('cart-item');
  private quantityInput = (productId: string) => 
    this.page.getByTestId(`quantity-${productId}`);
  private removeButton = (productId: string) => 
    this.page.getByTestId(`remove-${productId}`);

  // Actions
  async updateQuantity(productId: string, quantity: number) {
    await this.quantityInput(productId).fill(quantity.toString());
  }

  async removeItem(productId: string) {
    await this.removeButton(productId).click();
    await this.page.getByTestId('confirm-remove').click();
  }

  // Assertions
  async expectItemCount(count: number) {
    await expect(this.cartItems()).toHaveCount(count);
  }

  async expectTotalPrice(price: string) {
    await expect(this.page.getByTestId('total-price')).toContainText(price);
  }
}
```

### 2. Test Data Management
```typescript
// fixtures/test-data.ts
export const testUsers = {
  admin: { username: 'admin', password: 'admin123' },
  user: { username: 'user', password: 'user123' }
};

export const testProducts = [
  { id: '1', name: 'Laptop', price: 999, stock: 10 },
  { id: '2', name: 'Phone', price: 699, stock: 15 }
];

// tests/shopping-flow.spec.ts
test('complete shopping workflow', async ({ page }) => {
  // Use consistent test data
  const product = testProducts[0];
  
  await page.goto('/products');
  await page.getByTestId(`add-to-cart-${product.id}`).click();
  await page.goto('/cart');
  
  await expect(page.getByTestId('cart-item')).toContainText(product.name);
});
```

### 3. Test Isolation and Cleanup
```typescript
test.beforeEach(async ({ page }) => {
  // Reset application state before each test
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test.afterEach(async ({ page }) => {
  // Cleanup after each test
  await page.evaluate(() => {
    // Reset any global state
  });
});
```

### 4. Cross-browser and Mobile Testing
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Playwright Testing Tools and Commands

### Basic Test Commands
```bash
# Run all tests
npx playwright test

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test login.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Generate test code
npx playwright codegen localhost:3000
```

### Advanced Features
```typescript
// Screenshot testing
await expect(page).toHaveScreenshot('dashboard.png');

// Trace recording
await page.tracing.start({ screenshots: true, snapshots: true });
// ... test actions ...
await page.tracing.stop({ path: 'trace.zip' });

// Network interception
await page.route('**/api/products', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify(mockProducts)
  });
});

// Waiting strategies
await page.waitForLoadState('networkidle');
await page.waitForResponse(response => 
  response.url().includes('/api/cart') && response.status() === 200
);
```

## Success Criteria

Your implementation should:

✅ **Complete Cart Management**: Shopping cart with add, remove, update, and total calculations  
✅ **Authentication Flow**: Login with validation, loading states, and error handling  
✅ **Admin Interface**: Role-based dashboard with management features  
✅ **Report Generation**: Complex workflow with progress tracking and file downloads  
✅ **Proper Test IDs**: All interactive elements have data-testid attributes  
✅ **State Management**: Context providers handle state correctly across components  
✅ **Error Handling**: Graceful error handling and user feedback  
✅ **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation

## Advanced E2E Testing Challenges

1. **Visual Regression Testing**: Implement screenshot comparisons for UI consistency
2. **Performance Testing**: Add performance metrics and Core Web Vitals monitoring
3. **API Mocking**: Mock external APIs for consistent test environments
4. **Test Parallelization**: Configure optimal parallel execution strategies
5. **CI/CD Integration**: Set up automated test execution in deployment pipelines

## E2E Testing Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Cross-browser Testing Strategies](https://playwright.dev/docs/browsers)
- [API Testing with Playwright](https://playwright.dev/docs/api-testing)

End-to-end testing ensures your applications work flawlessly from the user's perspective across all browsers and devices! 🎭