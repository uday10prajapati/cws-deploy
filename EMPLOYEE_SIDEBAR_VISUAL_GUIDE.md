# Employee Navbar Sidebar - Visual Guide & Structure

## Sidebar Layout Overview

```
┌─────────────────────────────────┐
│    CarWash+                     │ ← Logo Section
│  Employee Portal                │
├─────────────────────────────────┤
│                                 │
│  🏠 Dashboard                   │ ← Main Menu (Always Visible)
│                                 │
├─────────────────────────────────┤
│  Divider Line                   │
├─────────────────────────────────┤
│                                 │
│  📋 Work              ▼         │ ← Expandable Section
│    └─ My Jobs                   │
│    └─ My Work                   │
│                                 │
│  👥 Sales              ▼        │ ← Expandable Section
│    └─ Customers                 │
│    └─ Assign Areas              │
│                                 │
│  💰 Earnings & Ratings ▼        │ ← Expandable Section
│    └─ Earnings                  │
│    └─ Ratings                   │
│                                 │
│  🚗 Resources          ▼        │ ← Expandable Section
│    └─ My Cars                   │
│    └─ Location                  │
│                                 │
├─────────────────────────────────┤
│  Divider Line                   │
├─────────────────────────────────┤
│                                 │
│  👤 Account            ▼        │ ← Expandable Section
│    └─ Profile                   │
│    └─ Settings                  │
│                                 │
├─────────────────────────────────┤
│                                 │
│  🚪 Logout (Red Button)         │ ← Logout Action
│                                 │
├─────────────────────────────────┤
│    © 2025 CarWash+              │ ← Footer
│    Employee Portal v1.0         │
└─────────────────────────────────┘
```

## Menu Structure (Nested Array Format)

```javascript
{
  mainMenu: [
    { label: "Dashboard", icon: "FiHome", link: "/employee/dashboard" }
  ],
  
  sections: [
    {
      title: "Work",
      icon: "FiClipboard",
      items: [
        { label: "My Jobs", icon: "FiClipboard", link: "/employee/jobs" },
        { label: "My Work", icon: "FiTruck", link: "/employee/workflow" }
      ]
    },
    {
      title: "Sales",
      icon: "FiUsers",
      items: [
        { label: "Customers", icon: "FiUsers", link: "/employee/customers" },
        { label: "Assign Areas", icon: "FiMapPin", link: "/employee/assign-areas" }
      ]
    },
    {
      title: "Earnings & Ratings",
      icon: "FiDollarSign",
      items: [
        { label: "Earnings", icon: "FiDollarSign", link: "/employee/earnings" },
        { label: "Ratings", icon: "FiAward", link: "/employee/ratings" }
      ]
    },
    {
      title: "Resources",
      icon: "FiMapPin",
      items: [
        { label: "My Cars", icon: "FaCar", link: "/employee/cars" },
        { label: "Location", icon: "FiMapPin", link: "/employee/location" }
      ]
    },
    {
      title: "Account",
      icon: "FiUser",
      items: [
        { label: "Profile", icon: "FiUser", link: "/profile" },
        { label: "Settings", icon: "FiSettings", link: "/employee/settings" }
      ]
    }
  ],
  
  logout: {
    label: "Logout",
    icon: "FiLogOut",
    action: "handleLogout()"
  }
}
```

## Responsive Behavior

### Desktop (lg: 1024px and above)
```
┌─────────────┬──────────────────────────────────────┐
│             │                                      │
│  Sidebar    │     Main Content Area                │
│  (Fixed)    │     (pt-20, lg:ml-64)                │
│  256px      │                                      │
│  (w-64)     │     ┌─────────────────────────────┐  │
│  pt-20      │     │  NavbarNew (Fixed Top)      │  │
│  (68px)     │     ├─────────────────────────────┤  │
│             │     │                             │  │
│  ├────────┤ │     │  Page Content               │  │
│  │ 🏠 Dash│ │     │  (max-w-7xl mx-auto)        │  │
│  │ ├─ Dash│ │     │                             │  │
│  │ │      │ │     │                             │  │
│  │ 📋 Work│ │     │                             │  │
│  │ ├─ Jobs│ │     └─────────────────────────────┘  │
│  │ └─ Work│ │                                      │
│  │        │ │                                      │
│  └────────┘ │                                      │
└─────────────┴──────────────────────────────────────┘
```

### Tablet (md: 768px - lg: 1024px)
```
Same as desktop but with adjusted spacing
```

### Mobile (below md: 768px)
```
┌────────────────────────────┐
│  NavbarNew (Fixed Top)     │ ← 64px (h-16)
│  ☰ Menu Button (FiMenu)    │
├────────────────────────────┤
│                            │
│  Main Content              │ ← pt-20, px-4
│  (max-w-7xl mx-auto)       │
│                            │
│                            │
│                            │
│                            │
└────────────────────────────┘

When Menu Button Clicked:
┌──────────────────────────────┐
│◄ 🏠 Dashboard            X   │ ← Sidebar Overlay
│   ├─ 📋 Work                 │    (w-64, pt-20)
│   │  ├─ My Jobs             │
│   │  └─ My Work             │
│   ├─ 👥 Sales               │
│   │  ├─ Customers           │
│   │  └─ Assign Areas        │
│   ├─ 💰 Earnings & Ratings  │
│   │  ├─ Earnings            │
│   │  └─ Ratings             │
│   ├─ 🚗 Resources           │
│   │  ├─ My Cars             │
│   │  └─ Location            │
│   ├─ 👤 Account             │
│   │  ├─ Profile             │
│   │  └─ Settings            │
│   └─ 🚪 Logout              │
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Dark Overlay (bg-opacity-50) │ ← Click to close
└──────────────────────────────┘
```

## Color States

### Active Link
```
Background: bg-blue-600
Text: text-white
Font: font-semibold
```

### Hover State
```
Background: bg-slate-100 (inactive)
Text: text-slate-700
Transition: smooth (200ms)
```

### Parent Section (Expanded)
```
Background: bg-blue-600 (if has active child)
Text: text-white
Chevron: rotate-180 (animation)
```

### Inactive Items
```
Background: transparent
Text: text-slate-700
Hover: bg-slate-100
```

## CSS Classes Used

### Sidebar Container
```css
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 16rem; /* w-64 */
  height: 100vh; /* h-screen */
  background: white;
  border-right: 1px solid #e2e8f0; /* border-slate-200 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */
  z-index: 40;
  padding-top: 5rem; /* pt-20 */
  overflow-y: auto;
  transition: transform 0.3s ease-in-out; /* duration-300 */
}

/* Mobile (hidden by default) */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%); /* -translate-x-full */
  }
  
  .sidebar.open {
    transform: translateX(0); /* translate-x-0 */
  }
}

/* Desktop (always visible) */
@media (min-width: 1024px) {
  .sidebar {
    transform: translateX(0);
  }
}
```

### Main Content
```css
.main-content {
  margin-left: 0;
  padding-top: 5rem; /* pt-20 */
}

@media (min-width: 1024px) {
  .main-content {
    margin-left: 16rem; /* lg:ml-64 */
  }
}
```

## Integration Checklist

### For Each Employee Page:
- [x] Import NavbarNew component
- [x] Import EmployeeSidebar component
- [x] Import FiMenu icon
- [x] Add sidebarOpen state
- [x] Add setSidebarOpen state setter
- [x] Wrap main content in div with lg:ml-64
- [x] Add pt-20 to main element
- [x] Add mobile menu button
- [x] Add wrapper div for content container
- [x] Close wrapper div before main closes

### Component Props
```javascript
<EmployeeSidebar 
  isOpen={sidebarOpen}
  setIsOpen={setSidebarOpen}
/>
```

## Mobile Menu Button Code
```jsx
<button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50"
>
  <FiMenu size={24} className="text-slate-700" />
</button>
```

## Key Features
1. ✅ Fully responsive (desktop, tablet, mobile)
2. ✅ Smooth animations and transitions
3. ✅ Active state highlighting
4. ✅ Expandable menu sections
5. ✅ Mobile overlay with backdrop
6. ✅ Auto-close on navigation (mobile)
7. ✅ Logout functionality
8. ✅ Consistent styling across app
9. ✅ Accessible navigation structure
10. ✅ Dark/light theme compatible

## Navigation Flow Example

```
User on /employee/dashboard
↓
Clicks "Customers" in Sales section
↓
Sidebar closes (mobile only)
↓
URL changes to /employee/customers
↓
AllCustomers page loads
↓
"Customers" link highlighted in blue
↓
"Sales" section expands (if not already)
```

## Expandable Section Behavior

```javascript
// Toggle section expansion
toggleSubmenu("sales") {
  expandedMenus["sales"] = !expandedMenus["sales"];
  // Render sub-items if true
}

// Auto-expand section if it has active link
const isParentActive = (links) => {
  return links.some(menu => isActive(menu.link));
}
```

## Accessibility Features
- Semantic HTML (nav, aside, main)
- ARIA labels for icons
- Keyboard navigation support
- Color contrast (WCAG AA compliant)
- Focus states on interactive elements
- Screen reader friendly structure
