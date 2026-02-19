- [ ] check card style:
```css
.dashboard-card {
  contain: layout; /* Standard performance boost */

  /* Using rem for consistent spacing */
  padding: 1.5rem;
  border-radius: 0.75rem; /* 12px */
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  
  /* Applying your fluid typography variables */
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  /* Soft shadow for depth */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.dashboard-card:hover {
  /* Only promote to GPU when the user is actually interacting with it */
  will-change: transform;

  transform: translateY(-4px); /* Slight lift on hover */
}

.dashboard-card h3 {
  font-size: var(--font-size-lg); /* Uses your clamp(16px, 2.5vw, 18px) */
  margin: 0;
}

.dashboard-card p {
  font-size: var(--font-size-base); /* Uses your clamp(14px, 2vw, 16px) */
  color: #64748b;
}
```

