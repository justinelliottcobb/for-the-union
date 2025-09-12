# SolidStart SSR Patterns

## Overview
Master SolidStart server-side rendering patterns with server functions, islands architecture, and progressive enhancement. This exercise teaches you how to build high-performance SSR applications using SolidStart's modern approach to meta-frameworks.

## Learning Objectives
- Master SolidStart SSR architecture and routing patterns
- Implement server functions with proper data fetching
- Build islands architecture for selective hydration
- Create progressive enhancement strategies
- Design streaming SSR with SolidJS patterns
- Optimize deployment and performance for SolidStart applications

## Key Concepts

### 1. SolidStart SSR
SolidStart provides file-based routing with automatic SSR capabilities and streaming support.

```typescript
// app.tsx
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/users/:id" component={User} />
      </Routes>
    </Router>
  );
}
```

### 2. Server Functions
Server functions run on the server and can be called from client components.

```typescript
// server functions
const getUser = server$(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});

// client usage
const user = await getUser("123");
```

### 3. Islands Architecture
Islands are interactive components that hydrate independently on the client.

```typescript
// Island component
export default function Counter() {
  const [count, setCount] = createSignal(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

### 4. Streaming SSR
SolidStart supports streaming SSR for faster TTFB and progressive loading.

```typescript
// Streaming with Suspense
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

### 5. Progressive Enhancement
Build applications that work without JavaScript and enhance with it.

```typescript
// Form that works with and without JS
<form action={updateUser} method="post">
  <input name="name" value={user().name} />
  <button type="submit">Update</button>
</form>
```

## Implementation Tasks

### Task 1: SSRProvider Class
Implement comprehensive SSR management:

```typescript
class SSRProvider {
  configureSSR(config: SSRConfig): void
  renderToStream(component: any, props?: any): ReadableStream
  renderToString(component: any, props?: any): string
  handleServerFunction(fn: ServerFunction): any
  optimizeBundle(): BundleInfo
}
```

**Requirements:**
- Support streaming and non-streaming SSR
- Handle server-side data fetching
- Implement bundle optimization
- Provide performance metrics

### Task 2: RouteHandler Class
Build advanced routing with SSR support:

```typescript
class RouteHandler {
  registerRoute(route: Route): void
  preloadRoute(path: string): Promise<void>
  generateStaticPaths(): string[]
  handleDynamicRoute(path: string, params: any): Route
  optimizeRouting(): void
}
```

**Requirements:**
- File-based routing with dynamic routes
- Route preloading and code splitting
- Static path generation for prerendering
- SEO-friendly routing

### Task 3: ServerFunction Class
Create server function management:

```typescript
class ServerFunction {
  createServerFunction<T>(handler: () => Promise<T>, name: string, options?: ServerFunctionOptions): ServerFunction
  executeServerFunction(fnId: string, ...args: any[]): Promise<any>
  cacheServerFunction(fnId: string, duration: number): void
  revalidateCache(fnId: string): Promise<void>
  handleMutations(): void
}
```

**Requirements:**
- Server-side execution with client calling
- Built-in caching and revalidation
- Form action integration
- Error handling and fallbacks

### Task 4: IslandComponent Class
Implement islands architecture:

```typescript
class IslandComponent {
  createIsland(component: any, props: any, id: string, priority?: Priority): Island
  hydrateIsland(islandId: string): Promise<void>
  prioritizeHydration(priority: Priority): void
  lazyHydrateIsland(islandId: string, trigger: HydrationTrigger): void
  optimizeIslands(): void
}
```

**Requirements:**
- Selective hydration with priority system
- Lazy hydration with triggers (visible, idle)
- Inter-island communication
- Performance optimization

## Advanced Patterns

### 1. Streaming SSR Implementation
```typescript
// Streaming setup
export default function App() {
  return (
    <Html>
      <Head>
        <Title>SolidStart App</Title>
      </Head>
      <Body>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
```

### 2. Server Function Patterns
```typescript
// Cached server function
const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
}, "user");

// Server action with validation
const updateUser = action(async (formData: FormData) => {
  const data = await parseFormData(formData);
  return await db.user.update({ 
    where: { id: data.id }, 
    data 
  });
});
```

### 3. Islands Communication
```typescript
// Shared context between islands
const UserContext = createContext();

// Provider at app level
function App() {
  const [user, setUser] = createSignal(null);
  
  return (
    <UserContext.Provider value={[user, setUser]}>
      <Island name="Header" />
      <Island name="Profile" />
    </UserContext.Provider>
  );
}

// Usage in islands
function ProfileIsland() {
  const [user] = useContext(UserContext);
  return <div>{user()?.name}</div>;
}
```

### 4. Progressive Enhancement
```typescript
// Component that works with and without JS
function SearchForm() {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal([]);

  // Works without JS via form submission
  const handleSubmit = async (e: Event) => {
    if (typeof window === "undefined") return; // SSR
    
    e.preventDefault();
    const data = await searchAPI(query());
    setResults(data);
  };

  return (
    <form action="/search" method="get" onSubmit={handleSubmit}>
      <input 
        name="q" 
        value={query()} 
        onInput={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
      
      {/* Enhanced with JS */}
      <div>{results().map(result => <div>{result.title}</div>)}</div>
    </form>
  );
}
```

## Performance Optimization

### 1. Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['solid-js'],
          utils: ['./src/utils/index.ts']
        }
      }
    }
  }
});
```

### 2. Hydration Optimization
```typescript
// Prioritized hydration
const priorities = {
  above_fold: 0,    // Immediate
  interactive: 100, // When idle
  below_fold: 200   // When visible
};

function MyIsland() {
  onMount(() => {
    // Only hydrate when necessary
    requestIdleCallback(() => {
      // Hydrate heavy components
    });
  });
}
```

### 3. Caching Strategy
```typescript
// Multi-level caching
const getUserData = cache(
  async (id: string) => {
    // Database query
    return await db.user.findUnique({ where: { id } });
  },
  "user-data",
  {
    revalidate: 60, // 1 minute
    tags: ["user", "profile"]
  }
);

// Cache invalidation
revalidateTag("user");
```

## Deployment Strategies

### 1. Vercel Deployment
```typescript
// app.config.ts
export default defineConfig({
  adapter: vercel({
    regions: ["iad1", "sfo1"],
    runtime: "edge"
  })
});
```

### 2. Cloudflare Workers
```typescript
export default defineConfig({
  adapter: cloudflarePages({
    compatibility_flags: ["streams_enable_constructors"]
  })
});
```

### 3. Node.js Server
```typescript
export default defineConfig({
  adapter: node({
    compression: true,
    precompress: true
  })
});
```

## Testing Strategy

### Unit Tests
```typescript
describe("Server Functions", () => {
  it("should fetch user data", async () => {
    const userData = await getUser("123");
    expect(userData).toMatchObject({
      id: "123",
      name: expect.any(String)
    });
  });
});
```

### Integration Tests
```typescript
// Test SSR output
describe("SSR Rendering", () => {
  it("should render page to string", () => {
    const html = renderToString(<App />);
    expect(html).toContain("<div>Hello World</div>");
  });
  
  it("should stream page chunks", async () => {
    const stream = renderToStream(<App />);
    const chunks = await collectStreamChunks(stream);
    expect(chunks.join("")).toContain("<!DOCTYPE html>");
  });
});
```

### E2E Tests
```typescript
// Test hydration and interactivity
test("island hydration", async ({ page }) => {
  await page.goto("/");
  
  // Should work without JS
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/search?q=test");
  
  // Should enhance with JS
  await page.evaluate(() => window.enableJS = true);
  await page.click("button[data-testid=search]");
  await expect(page.locator("[data-testid=results]")).toBeVisible();
});
```

## Success Criteria
- SSR renders pages correctly
- Streaming works with progressive loading
- Server functions execute and cache properly
- Islands hydrate selectively
- Performance metrics are optimal
- Deployment works across platforms

## Tips for Success
1. **Understand SSR vs CSR**: Know when to render on server vs client
2. **Optimize Bundle Size**: Use code splitting and tree shaking effectively
3. **Handle Hydration Carefully**: Avoid hydration mismatches
4. **Implement Progressive Enhancement**: Ensure functionality without JS
5. **Monitor Performance**: Track TTFB, FCP, LCP, and hydration time
6. **Cache Strategically**: Use appropriate caching levels and invalidation

This exercise provides comprehensive understanding of modern SSR patterns with SolidStart's innovative approach to meta-frameworks.