# acteFlow Web Interface - Design Document

**Project Version:** 1.0.0  
**Last Updated:** 2025-10-28  
**Design System Version:** 1.0

---

## 🎨 Design Philosophy

The web interface design is directly inspired by the acteFlow desktop application, maintaining consistency across platforms while adapting to web-specific patterns and responsive requirements.

### Core Principles
1. **Professional & Official** - Suitable for government/legal document management
2. **Clean & Minimalist** - Focus on content, reduce visual noise
3. **Accessible** - WCAG 2.1 AA compliance
4. **Bilingual** - Seamless French/Arabic switching with RTL support
5. **Efficient Workflow** - Minimize clicks, maximize productivity
6. **Consistent** - Match desktop app visual language

---

## 🎨 Color Palette

### Primary Colors
Inspired directly from the desktop application:

```css
/* Main Brand Colors */
--gold-primary: #d4af37;      /* Signature gold accent */
--gold-hover: #c19b2f;        /* Gold hover state */
--gold-light: #e5c860;        /* Light gold */

/* Dark Theme Base (Desktop App Style) */
--bg-primary: #1a1f2e;        /* Main background */
--bg-secondary: #252d3f;      /* Card/Panel background */
--bg-tertiary: #2d3748;       /* Elevated elements */
--bg-hover: #374151;          /* Hover state background */

/* Borders & Dividers */
--border-primary: #2d3748;    /* Main border color */
--border-secondary: #374151;  /* Secondary borders */
--border-light: rgba(255, 255, 255, 0.1);

/* Text Colors */
--text-primary: #f7fafc;      /* Primary text (white) */
--text-secondary: #cbd5e0;    /* Secondary text (light gray) */
--text-tertiary: #a0aec0;     /* Tertiary text (gray) */
--text-muted: #718096;        /* Muted text */
```

### Status Colors

```css
/* Document Status Colors */
--status-pending: #fbbf24;     /* Yellow - Pending review */
--status-reviewing: #60a5fa;   /* Blue - Currently reviewing */
--status-rejected: #f87171;    /* Red - Rejected for update */
--status-stored: #34d399;      /* Green - Successfully stored */

/* Semantic Colors */
--success: #10b981;
--success-light: #34d399;
--success-bg: rgba(16, 185, 129, 0.1);

--error: #ef4444;
--error-light: #f87171;
--error-bg: rgba(239, 68, 68, 0.1);

--warning: #f59e0b;
--warning-light: #fbbf24;
--warning-bg: rgba(245, 158, 11, 0.1);

--info: #3b82f6;
--info-light: #60a5fa;
--info-bg: rgba(59, 130, 246, 0.1);
```

---

## 📝 Typography

### Font Families

```css
/* Primary Font Stack */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;

/* Arabic Font Support */
--font-arabic: 'Noto Sans Arabic', 'Tajawal', 'Cairo', sans-serif;

/* Monospace (for code/IDs) */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
```

### Type Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 🏗️ Layout Structure

### Overall Layout (Desktop App Inspired)

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER BAR                           │
│  [Logo] acteFlow    [User Info] [Notifications] [Logout]   │
├──────────────┬────────────────────────────┬──────────────────┤
│              │                            │                  │
│   SIDEBAR    │     MAIN CONTENT AREA      │  DETAIL PANEL   │
│              │                            │  (conditional)   │
│  - Dashboard │   Documents / Reviews /    │                  │
│  - Documents │   Users / Analytics        │  PDF Viewer /    │
│  - Review    │                            │  Form Panel /    │
│  - Tree      │   [Dynamic Content]        │  User Details    │
│  - Users     │                            │                  │
│              │                            │                  │
│   200-250px  │      flex-grow-1           │    300-400px     │
└──────────────┴────────────────────────────┴──────────────────┘
```

### Header Bar (60px height)

```jsx
<Header>
  <Logo>
    <Icon /> acteFlow
  </Logo>
  
  <HeaderActions>
    <LanguageSwitcher /> {/* FR ⇄ AR */}
    <NotificationBell badge={3} />
    <UserMenu>
      <Avatar />
      <UserName />
      <Dropdown>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <Divider />
        <MenuItem>Logout</MenuItem>
      </Dropdown>
    </UserMenu>
  </HeaderActions>
</Header>
```

### Sidebar Navigation (250px width)

```jsx
<Sidebar>
  {/* Admin Only */}
  <NavItem icon="dashboard" active>
    Dashboard
  </NavItem>
  
  {/* All Roles */}
  <NavItem icon="documents">
    Documents
    <Badge>45</Badge>
  </NavItem>
  
  {/* Supervisor Only */}
  <NavItem icon="review">
    Review Queue
    <Badge variant="warning">12</Badge>
  </NavItem>
  
  {/* Admin, Supervisor */}
  <NavItem icon="tree">
    Document Tree
  </NavItem>
  
  {/* Admin Only */}
  <NavItem icon="users">
    User Management
  </NavItem>
  
  <Divider />
  
  {/* All Roles */}
  <NavItem icon="search">
    Search
  </NavItem>
</Sidebar>
```

---

## 🧩 Component Specifications

### 1. Buttons

#### Primary Button (Gold Accent)
```jsx
<Button variant="primary">
  <Icon name="save" />
  <span>Save Document</span>
</Button>
```

**Styles:**
```css
.btn-primary {
  background: linear-gradient(135deg, #d4af37 0%, #c19b2f 100%);
  color: #1a1f2e;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(212, 175, 55, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #c19b2f 0%, #a88427 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #f7fafc;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #d4af37;
}
```

#### Danger Button
```css
.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}
```

#### Button Sizes
```css
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }
.btn-md { padding: 0.625rem 1.25rem; font-size: 1rem; }
.btn-lg { padding: 0.875rem 1.75rem; font-size: 1.125rem; }
```

---

### 2. Form Elements

#### Input Field
```jsx
<FormGroup>
  <Label>Bureau</Label>
  <Input 
    type="text" 
    placeholder="Sélectionnez un bureau"
    icon="building"
  />
  <HelpText>Choisissez le bureau concerné</HelpText>
</FormGroup>
```

**Styles:**
```css
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.375rem;
}
```

#### Select Dropdown
```jsx
<Select>
  <option value="">Sélectionnez un type</option>
  <option value="naissances">Registre des naissances</option>
  <option value="deces">Registre des décès</option>
</Select>
```

**Styles:**
```css
.form-select {
  /* Same as input base styles */
  appearance: none;
  background-image: url("data:image/svg+xml...");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}
```

#### Searchable Select (Custom)
```jsx
<SearchableSelect
  options={bureaux}
  placeholder="Rechercher un bureau..."
  onChange={handleChange}
/>
```

---

### 3. Cards

#### Document Card (List View)
```jsx
<DocumentCard status="pending">
  <CardIcon status="pending">
    <PDFIcon />
  </CardIcon>
  
  <CardContent>
    <CardTitle>Acte N° A0123</CardTitle>
    <CardMeta>
      <MetaItem icon="building">Anfa</MetaItem>
      <MetaItem icon="calendar">2024</MetaItem>
      <MetaItem icon="user">Agent: John Doe</MetaItem>
    </CardMeta>
  </CardContent>
  
  <CardBadge status="pending">
    En attente
  </CardBadge>
</DocumentCard>
```

**Styles:**
```css
.document-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.document-card:hover {
  background: var(--bg-tertiary);
  border-color: var(--gold-primary);
  transform: translateX(4px);
}

.document-card.active {
  border-color: var(--gold-primary);
  background: var(--bg-tertiary);
}
```

#### Stat Card (Dashboard)
```jsx
<StatCard>
  <StatIcon color="gold">
    <DocumentIcon />
  </StatIcon>
  <StatContent>
    <StatValue>1,234</StatValue>
    <StatLabel>Total Documents</StatLabel>
    <StatTrend up>+12% from last month</StatTrend>
  </StatContent>
</StatCard>
```

**Styles:**
```css
.stat-card {
  background: linear-gradient(135deg, #252d3f 0%, #2d3748 100%);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  gap: 1.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
```

---

### 4. Status Badges

```jsx
<Badge status="pending">En attente</Badge>
<Badge status="reviewing">En révision</Badge>
<Badge status="rejected">Rejeté</Badge>
<Badge status="stored">Stocké</Badge>
```

**Styles:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.badge-reviewing {
  background: rgba(96, 165, 250, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.badge-rejected {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.badge-stored {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}
```

---

### 5. Modals

#### Standard Modal
```jsx
<Modal>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Reject Document</ModalTitle>
      <ModalClose />
    </ModalHeader>
    
    <ModalBody>
      {/* Form content */}
    </ModalBody>
    
    <ModalFooter>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Reject</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Styles:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 50;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 51;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
```

---

### 6. Notifications (Toast)

```jsx
<Toast type="success" position="top-right">
  <ToastIcon>✓</ToastIcon>
  <ToastContent>
    <ToastTitle>Document Approved</ToastTitle>
    <ToastMessage>Document A0123 has been stored successfully</ToastMessage>
  </ToastContent>
  <ToastClose />
</Toast>
```

**Styles:**
```css
.toast {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-left: 4px solid var(--success);
  border-radius: 12px;
  padding: 1rem;
  min-width: 320px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  gap: 1rem;
}

.toast-success { border-left-color: var(--success); }
.toast-error { border-left-color: var(--error); }
.toast-warning { border-left-color: var(--warning); }
.toast-info { border-left-color: var(--info); }
```

---

### 7. Tables

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Document</TableHead>
      <TableHead>Bureau</TableHead>
      <TableHead>Agent</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>A0123</TableCell>
      <TableCell>Anfa</TableCell>
      <TableCell>John Doe</TableCell>
      <TableCell><Badge status="pending">Pending</Badge></TableCell>
      <TableCell>
        <ActionButton icon="eye" />
        <ActionButton icon="edit" />
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Styles:**
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 2px solid var(--border-primary);
}

.table-head {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.table-row {
  border-bottom: 1px solid var(--border-primary);
  transition: background 0.2s ease;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.table-cell {
  padding: 1rem;
  color: var(--text-primary);
}
```

---

### 8. Navigation Tabs

```jsx
<Tabs>
  <Tab active>All Documents</Tab>
  <Tab>Pending</Tab>
  <Tab>Rejected</Tab>
  <TabIndicator />
</Tabs>
```

**Styles:**
```css
.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-primary);
  position: relative;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  position: relative;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--gold-primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gold-primary);
}
```

---

### 9. Tree View Component

```jsx
<TreeView>
  <TreeNode icon="folder" expandable>
    Anfa
    <TreeChildren>
      <TreeNode icon="folder" expandable>
        Registre des naissances
        <TreeChildren>
          <TreeNode icon="folder" expandable>
            2024
            <TreeNode icon="file">A0001.pdf</TreeNode>
            <TreeNode icon="file">A0002.pdf</TreeNode>
          </TreeNode>
        </TreeChildren>
      </TreeNode>
    </TreeChildren>
  </TreeNode>
</TreeView>
```

**Styles:**
```css
.tree-node {
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.tree-node:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tree-node.active {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.tree-children {
  padding-left: 1.5rem;
  border-left: 1px dashed var(--border-primary);
  margin-left: 0.75rem;
}
```

---

### 10. PDF Viewer Panel

```jsx
<PDFViewerPanel>
  <PDFToolbar>
    <ToolButton icon="zoom-in" />
    <ToolButton icon="zoom-out" />
    <PageIndicator>Page 1 of 5</PageIndicator>
    <ToolButton icon="download" />
  </PDFToolbar>
  
  <PDFCanvas>
    {/* react-pdf viewer */}
  </PDFCanvas>
</PDFViewerPanel>
```

**Styles:**
```css
.pdf-viewer-panel {
  background: #1e1e1e;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-toolbar {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.pdf-canvas {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
```

---

## 📱 Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large Desktop */
```

### Mobile Layout (< 768px)
```
┌─────────────────────────┐
│   Mobile Header         │
│   [☰] acteFlow [👤]     │
├─────────────────────────┤
│                         │
│   Main Content          │
│   (Full Width)          │
│                         │
│   Sidebar as Drawer     │
│   (Slide from left)     │
│                         │
└─────────────────────────┘
```

### Tablet Layout (768px - 1024px)
```
┌───────┬─────────────────┐
│       │                 │
│ Side  │  Main Content   │
│ bar   │  (Expanded)     │
│       │                 │
│ 200px │   flex-grow     │
└───────┴─────────────────┘
```

---

## 🌍 Internationalization (i18n)

### Language Switcher
```jsx
<LanguageSwitcher>
  <Button onClick={toggleLanguage}>
    <GlobeIcon />
    <span>{currentLang === 'fr' ? 'FR' : 'AR'}</span>
  </Button>
</LanguageSwitcher>
```

### RTL Support
```css
/* Automatically applied when language is Arabic */
html[dir="rtl"] {
  direction: rtl;
}

html[dir="rtl"] .main-content {
  flex-direction: row-reverse;
}

html[dir="rtl"] .sidebar {
  border-left: 1px solid var(--border-primary);
  border-right: none;
}
```

---

## 🎬 Animations & Transitions

### Micro-interactions
```css
/* Button Press */
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

/* Card Hover */
.document-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.document-card:hover {
  transform: translateX(4px);
}

/* Modal Entry */
@keyframes modal-enter {
  0% {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

/* Toast Slide In */
@keyframes toast-slide-in {
  0% {
    transform: translateX(400px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Skeleton Loading */
@keyframes skeleton-loading {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 25%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
```

---

## 🎯 Page-Specific Designs

### 1. Dashboard (Admin Only)

```
┌────────────────────────────────────────────────┐
│  Dashboard                                      │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ Total│  │Pending│ │Stored│  │Rejected│      │
│  │ 1234 │  │  45  │  │ 1154│  │   23   │      │
│  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                 │
│  ┌─────────────────────┐  ┌─────────────────┐│
│  │ Documents Over Time │  │ Status Pie Chart││
│  │  [Line Chart]       │  │  [Pie Chart]    ││
│  └─────────────────────┘  └─────────────────┘│
│                                                 │
│  ┌─────────────────────┐  ┌─────────────────┐│
│  │ Bureau Statistics   │  │ Recent Activity ││
│  │  [Bar Chart]        │  │  [Activity Feed]││
│  └─────────────────────┘  └─────────────────┘│
│                                                 │
└────────────────────────────────────────────────┘
```

### 2. Document Review (Supervisor)

```
┌─────────────┬─────────────────────┬──────────────┐
│             │                     │              │
│  Pending    │   PDF Viewer        │  Review Form │
│  Queue      │                     │              │
│             │   [Document]        │  ✓ Approve   │
│  [Doc 1]    │                     │  ✗ Reject    │
│  [Doc 2] ←  │   Page 1 of 3       │              │
│  [Doc 3]    │                     │  Metadata:   │
│             │   [Zoom] [Nav]      │  - Bureau    │
│             │                     │  - Type      │
│             │                     │  - Year      │
│             │                     │              │
└─────────────┴─────────────────────┴──────────────┘
```

### 3. Document Tree (Admin/Supervisor)

```
┌─────────────────────────────────────────────────┐
│  Document Tree                    [Search Bar] │
├─────────────────────────────────────────────────┤
│                                                  │
│  📁 Anfa (234 documents)                        │
│    📁 Registre des naissances (150)            │
│      📁 2024 (89)                               │
│        📁 R001 (45)                             │
│          📄 A0001.pdf                           │
│          📄 A0002.pdf                           │
│        📁 R002 (44)                             │
│      📁 2023 (61)                               │
│    📁 Registre des décès (84)                  │
│                                                  │
│  📁 Maarif (189 documents)                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4. User Management (Admin)

```
┌─────────────────────────────────────────────────┐
│  Users                        [+ Add User]      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Name    │ Role       │ Status │ Actions│   │
│  ├─────────────────────────────────────────┤   │
│  │ John    │ Agent      │ Active │ [Edit] │   │
│  │ Jane    │ Supervisor │ Active │ [Edit] │   │
│  │ Admin   │ Admin      │ Active │ [Edit] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [Pagination]                                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔔 Notification System

### Notification Bell (Header)
```jsx
<NotificationBell badge={unreadCount}>
  <BellIcon />
  {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
</NotificationBell>
```

### Notification Dropdown
```jsx
<NotificationDropdown>
  <DropdownHeader>
    <Title>Notifications</Title>
    <MarkAllRead />
  </DropdownHeader>
  
  <NotificationList>
    <NotificationItem unread>
      <NotificationIcon type="rejection" />
      <NotificationContent>
        <NotificationTitle>Document Rejected</NotificationTitle>
        <NotificationMessage>
          Document A0123 was rejected - Acte mal scanné
        </NotificationMessage>
        <NotificationTime>2 minutes ago</NotificationTime>
      </NotificationContent>
    </NotificationItem>
  </NotificationList>
  
  <DropdownFooter>
    <ViewAllLink>View All Notifications</ViewAllLink>
  </DropdownFooter>
</NotificationDropdown>
```

---

## 🎨 Icon System

### Icon Library
Use **Lucide Icons** or **Heroicons** for consistency.

### Common Icons
```jsx
// Navigation
<Icon name="home" />          // Dashboard
<Icon name="file-text" />     // Documents
<Icon name="eye" />           // Review
<Icon name="folder-tree" />   // Tree
<Icon name="users" />         // Users
<Icon name="search" />        // Search

// Actions
<Icon name="check" />         // Approve
<Icon name="x" />             // Reject
<Icon name="edit" />          // Edit
<Icon name="trash" />         // Delete
<Icon name="download" />      // Download
<Icon name="upload" />        // Upload

// Status
<Icon name="clock" />         // Pending
<Icon name="eye" />           // Reviewing
<Icon name="alert-circle" />  // Rejected
<Icon name="check-circle" />  // Stored
```

---

## 📐 Spacing System

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

---

## 🎯 Accessibility

### WCAG 2.1 AA Compliance
- ✅ Color contrast ratio: 4.5:1 for normal text
- ✅ Color contrast ratio: 3:1 for large text
- ✅ Focus indicators on all interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader support (ARIA labels)
- ✅ Alternative text for icons

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);
}
```

---

## 📦 Component Library Reference

### Recommended Libraries
- **UI Components:** Radix UI (unstyled, accessible)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Charts:** Recharts or Chart.js
- **PDF Viewer:** react-pdf
- **Date Picker:** react-day-picker
- **Toast:** Sonner
- **Drag & Drop:** dnd-kit

---

## 🎨 Dark Mode (Future Enhancement)

While the primary design is dark-themed, consider adding a light mode toggle:

```css
/* Light Mode Colors */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  /* ... */
}
```

---

## 📝 Design Checklist

### Before Implementation
- [ ] Review all color values for accessibility
- [ ] Test RTL layout in Arabic
- [ ] Verify responsive breakpoints
- [ ] Check all button states (hover, active, disabled)
- [ ] Ensure consistent spacing throughout
- [ ] Test keyboard navigation flow
- [ ] Verify focus indicators are visible

### During Development
- [ ] Use design tokens (CSS variables)
- [ ] Test on multiple screen sizes
- [ ] Test in different browsers
- [ ] Validate with accessibility tools
- [ ] Test with screen readers
- [ ] Check performance (animation frame rates)

---

## 🔗 Related Resources

- [Desktop App CSS](./styles.css) - Reference for existing styles
- [Desktop App RTL](./rtl.css) - RTL implementation reference
- [Translations](./translations.json) - Copy text values
- TailwindCSS Documentation
- Radix UI Documentation

---

**Last Updated By:** Assistant  
**Next Review:** After Phase 1 completion