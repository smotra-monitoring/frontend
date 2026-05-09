# Responsive Testing Guide

This document provides a comprehensive guide for testing the responsive design of the Smotra frontend across different viewports and devices.

## Testing Viewports

Test at these standard viewport sizes:

| Device Category | Width (px) | Height (px) | Columns | Notes |
|----------------|-----------|-------------|---------|-------|
| Mobile Small   | 375       | 667         | 1       | iPhone SE, Galaxy S8 |
| Mobile Large   | 414       | 896         | 1       | iPhone 11, Pixel 3 |
| Tablet Portrait| 768       | 1024        | 2       | iPad, Surface |
| Tablet Landscape| 1024     | 768         | 3-4     | iPad Landscape |
| Desktop        | 1280      | 800         | 3-4     | Standard laptop |
| Desktop HD     | 1440      | 900         | 4-5     | Larger displays |
| Desktop FHD    | 1920      | 1080        | 5-6     | Full HD |
| Ultra-wide     | 2560      | 1440        | 6+      | 4K, ultra-wide |

## Breakpoint Behavior

### Mobile (< 768px)

**Layout:**
- Single column Bento-Box grid
- Hamburger menu
- Bottom navigation bar
- Full-width cards
- Tables collapse to card view
- Command palette full-screen

**Navigation:**
- Hamburger icon in header
- Overlay sidebar
- Backdrop when sidebar open
- Swipe to close supported

**Touch Targets:**
- All buttons minimum 44px × 44px
- Bottom navigation in thumb zone
- Toast notifications at bottom

**Testing Checklist:**
- [ ] Dashboard grid shows 1 column
- [ ] Hamburger menu opens/closes
- [ ] Bottom navigation accessible
- [ ] All touch targets 44px+
- [ ] Smooth scroll works
- [ ] Theme toggle accessible
- [ ] Command palette full-screen
- [ ] Toast notifications at bottom
- [ ] No horizontal scroll
- [ ] Text readable without zoom

### Tablet (768px - 1023px)

**Layout:**
- 2 column Bento-Box grid
- Hamburger menu or collapsible sidebar
- Tables can scroll horizontally or card view
- Command palette centered overlay

**Testing Checklist:**
- [ ] Dashboard grid shows 2 columns
- [ ] Navigation toggles properly
- [ ] Touch targets adequate
- [ ] Landscape vs portrait tested
- [ ] Command palette sized correctly
- [ ] Theme toggle visible

### Desktop (1024px - 1439px)

**Layout:**
- 3-4 column Bento-Box grid
- Fixed 200px sidebar with labels
- Full-width tables
- Command palette 600px centered

**Testing Checklist:**
- [ ] Dashboard grid shows 3-4 columns
- [ ] Sidebar fixed and visible
- [ ] Main content: calc(100vw - 200px)
- [ ] Tables display all columns
- [ ] Hover states work
- [ ] Theme toggle in toolbar
- [ ] Command palette Cmd+K

### Desktop Wide (1440px - 1919px)

**Layout:**
- 4-5 column grid
- Full information density

**Testing Checklist:**
- [ ] Grid shows 4-5 columns
- [ ] No wasted white space
- [ ] All content comfortably readable

### Ultra-wide (1920px+)

**Layout:**
- 5-6+ column grid
- Maximum information density

**Testing Checklist:**
- [ ] Grid shows 5-6+ columns
- [ ] Content utilizes full width
- [ ] No artificial max-width constraints
- [ ] Information remains scannable

## Component-Specific Testing

### Dashboard Grid

```typescript
describe('Dashboard Grid Responsive', () => {
  test('1 column on mobile 375px', () => {
    setViewport(375, 667);
    expect(getColumnCount()).toBe(1);
  });
  
  test('2 columns on tablet 768px', () => {
    setViewport(768, 1024);
    expect(getColumnCount()).toBe(2);
  });
  
  test('3-4 columns on desktop 1280px', () => {
    setViewport(1280, 800);
    const cols = getColumnCount();
    expect(cols).toBeGreaterThanOrEqual(3);
    expect(cols).toBeLessThanOrEqual(4);
  });
  
  test('5-6 columns on ultra-wide 1920px', () => {
    setViewport(1920, 1080);
    const cols = getColumnCount();
    expect(cols).toBeGreaterThanOrEqual(5);
  });
});
```

### Sidebar Navigation

```typescript
describe('Sidebar Responsive', () => {
  test('hamburger menu on mobile', () => {
    setViewport(375, 667);
    expect(querySelector('.mobile-header__menu')).toBeVisible();
    expect(querySelector('.sidebar')).toHaveClass('sidebar--mobile');
  });
  
  test('fixed sidebar on desktop', () => {
    setViewport(1280, 800);
    expect(querySelector('.sidebar')).toHaveStyle({ width: '200px' });
    expect(querySelector('.mobile-header__menu')).not.toBeVisible();
  });
});
```

### Command Palette

```typescript
describe('Command Palette Responsive', () => {
  test('full-screen on mobile', () => {
    setViewport(375, 667);
    openCommandPalette();
    const modal = querySelector('.command-palette__modal');
    expect(modal).toHaveStyle({ width: '100%', height: '100vh' });
  });
  
  test('600px centered on desktop', () => {
    setViewport(1280, 800);
    openCommandPalette();
    const modal = querySelector('.command-palette__modal');
    expect(modal).toHaveStyle({ width: '600px' });
  });
});
```

### Toast Notifications

```typescript
describe('Toast Responsive', () => {
  test('bottom-center on mobile', () => {
    setViewport(375, 667);
    showToast('Test message');
    const container = querySelector('.toast-container');
    expect(container).toHaveClass('toast-container--mobile');
  });
  
  test('bottom-right on desktop', () => {
    setViewport(1280, 800);
    showToast('Test message');
    const container = querySelector('.toast-container');
    expect(container).not.toHaveClass('toast-container--mobile');
  });
});
```

## Touch Target Testing

All interactive elements must meet 44px minimum on mobile/tablet:

```typescript
describe('Touch Targets', () => {
  test('all buttons minimum 44px', () => {
    setViewport(375, 667);
    const buttons = querySelectorAll('button, a, input[type="button"]');
    
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });
  
  test('adequate spacing between targets', () => {
    setViewport(375, 667);
    const buttons = querySelectorAll('.button-group > button');
    
    for (let i = 0; i < buttons.length - 1; i++) {
      const rect1 = buttons[i].getBoundingClientRect();
      const rect2 = buttons[i + 1].getBoundingClientRect();
      const gap = rect2.left - rect1.right;
      expect(gap).toBeGreaterThanOrEqual(8);
    }
  });
});
```

## Theme Testing

Test both light and dark themes at all breakpoints:

```typescript
describe('Theme Responsive', () => {
  test('theme toggle visible at all sizes', () => {
    [375, 768, 1280, 1920].forEach(width => {
      setViewport(width, 800);
      expect(querySelector('.theme-toggle')).toBeVisible();
    });
  });
  
  test('theme transitions work', () => {
    setViewport(1280, 800);
    setTheme('dark');
    expect(document.documentElement).toHaveClass('theme-dark');
    
    setTheme('light');
    expect(document.documentElement).toHaveClass('theme-light');
  });
});
```

## Accessibility Testing

### Keyboard Navigation

```typescript
describe('Keyboard Navigation', () => {
  test('all interactive elements focusable', () => {
    const focusables = querySelectorAll('button, a, input, select, textarea');
    focusables.forEach(el => {
      el.focus();
      expect(document.activeElement).toBe(el);
    });
  });
  
  test('Tab order logical', () => {
    const firstFocusable = querySelector('button');
    firstFocusable.focus();
    
    pressTab();
    expect(document.activeElement.tagName).toBe('BUTTON');
  });
});
```

### Screen Reader

Test with screen readers:
- VoiceOver (macOS/iOS)
- NVDA (Windows)
- TalkBack (Android)

Checklist:
- [ ] All images have alt text
- [ ] Status indicators have aria-labels
- [ ] Forms have labels
- [ ] Buttons have descriptive text/aria-label
- [ ] Loading states announced
- [ ] Error messages announced
- [ ] Heading hierarchy correct

### Reduced Motion

```typescript
describe('Reduced Motion', () => {
  test('disables animations when preferred', () => {
    enableReducedMotion();
    
    const pulse = querySelector('.status-pulse');
    const styles = getComputedStyle(pulse);
    expect(styles.animationDuration).toBe('0.01ms');
  });
  
  test('disables smooth scroll', () => {
    enableReducedMotion();
    
    const html = document.documentElement;
    const styles = getComputedStyle(html);
    expect(styles.scrollBehavior).toBe('auto');
  });
});
```

## Browser Testing

Test in multiple browsers:

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✓       | ✓      | Primary target |
| Firefox | ✓       | ✓      | CSS Grid support |
| Safari  | ✓       | ✓      | WebKit quirks |
| Edge    | ✓       | ✓      | Chromium-based |

## Device Testing

Physical devices to test:

**Mobile:**
- iPhone 12/13 (390 × 844)
- iPhone SE (375 × 667)
- Samsung Galaxy S21 (360 × 800)
- Pixel 5 (393 × 851)

**Tablet:**
- iPad (768 × 1024)
- iPad Pro (1024 × 1366)
- Surface Pro (1368 × 912)

## Performance Testing

### Mobile Performance

```typescript
describe('Mobile Performance', () => {
  test('First Contentful Paint < 1.5s on 3G', () => {
    throttleNetwork('3G');
    const fcp = measureFCP();
    expect(fcp).toBeLessThan(1500);
  });
  
  test('Time to Interactive < 3.5s on 3G', () => {
    throttleNetwork('3G');
    const tti = measureTTI();
    expect(tti).toBeLessThan(3500);
  });
});
```

### Scroll Performance

```typescript
describe('Scroll Performance', () => {
  test('60fps scrolling with 6 column grid', () => {
    setViewport(1920, 1080);
    loadAgents(100);
    
    const fps = measureScrollFPS();
    expect(fps).toBeGreaterThanOrEqual(60);
  });
});
```

## Visual Regression Testing

Take screenshots at all breakpoints and compare:

```typescript
describe('Visual Regression', () => {
  test('dashboard matches baseline', async () => {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

## Testing Matrix

| Component         | 375px | 768px | 1280px | 1920px | Light | Dark | A11y |
|-------------------|-------|-------|--------|--------|-------|------|------|
| Dashboard Grid    | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Agent Card        | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Sidebar           | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Command Palette   | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Toast Notifications| ✓    | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Theme Toggle      | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |
| Login Page        | ✓     | ✓     | ✓      | ✓      | ✓     | ✓    | ✓    |

## Continuous Testing

Integrate responsive tests into CI/CD:

```yaml
# .github/workflows/test.yml
- name: Responsive Tests
  run: |
    npm run test:responsive
    npm run test:a11y
    npm run test:visual
```

## Manual Testing Checklist

For each viewport size:

- [ ] **Layout**
  - [ ] Grid columns correct
  - [ ] No horizontal scroll
  - [ ] Content readable
  - [ ] Images scale properly

- [ ] **Navigation**
  - [ ] Menu accessible
  - [ ] Links work
  - [ ] Routing correct

- [ ] **Interactions**
  - [ ] Touch targets adequate
  - [ ] Buttons clickable/tappable
  - [ ] Forms usable
  - [ ] Modals sized correctly

- [ ] **Performance**
  - [ ] Smooth scrolling
  - [ ] No jank
  - [ ] Fast load time

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader friendly
  - [ ] Proper focus indicators
  - [ ] Reduced motion respected

- [ ] **Themes**
  - [ ] Light theme works
  - [ ] Dark theme works
  - [ ] Smooth transitions

## Tools

- **Chrome DevTools**: Device emulation, performance profiling
- **Firefox Responsive Design Mode**: Multi-device testing
- **BrowserStack**: Real device testing
- **Lighthouse**: Performance and accessibility audits
- **axe DevTools**: Accessibility testing
- **Percy**: Visual regression testing

## Best Practices

1. **Test early and often**: Don't wait until the end
2. **Use real devices**: Emulators don't catch everything
3. **Test multiple browsers**: Cross-browser compatibility
4. **Automate what you can**: Faster feedback loops
5. **Manual testing still necessary**: Some things can't be automated
6. **Document issues**: Track responsive bugs systematically
7. **Performance matters**: Especially on mobile
8. **Accessibility is not optional**: Test with assistive technologies
