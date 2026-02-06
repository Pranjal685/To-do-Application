# Premium Design System
## Minimal Luxury × Futuristic Glassmorphism

This document outlines the premium design system featuring a sophisticated hybrid aesthetic that combines minimal luxury with futuristic glassmorphism effects.

---

## 🎨 Color Palette

### Primary Backgrounds
- **Soft Pearl White** - `#F7F7F5` - Light mode primary background
- **Charcoal Graphite** - `#0E0F10` - Dark mode primary background

### Cards / Surfaces
- **Frosted Glass Light** - `rgba(255, 255, 255, 0.15)` + blur - Light mode glass surfaces
- **Smoked Glass Dark** - `rgba(20, 20, 20, 0.6)` + blur - Dark mode glass surfaces

### Accent Colors
- **Champagne Gold** - `#CBA135` - Primary accent, premium actions
- **Crystal Teal** - `#2EA6E9` - Secondary accent, highlights

### Status Colors
- **Success Mint** - `#62E3A0` - Success states, positive feedback
- **Warning Amber** - `#F4C95D` - Warnings, attention needed
- **Error Rose Red** - `#E04656` - Errors, destructive actions

### Typography
- **Primary Light** - `#0E0E0E` - Main text in light mode
- **Primary Dark** - `#FFFFFF` - Main text in dark mode
- **Secondary Light** - `#434343` - Secondary text in light mode
- **Secondary Dark** - `#C6C6C6` - Secondary text in dark mode

---

## 🧩 Component System

### Button Variants

```tsx
// Premium gradient button with gold shimmer
<Button variant="premium">Create Task</Button>

// Glassmorphism button
<Button variant="glass">View Details</Button>

// Standard with glow effects
<Button variant="default">Submit</Button>

// Outline with gold border
<Button variant="outline">Cancel</Button>
```

**Available Variants:**
- `default` - Champagne gold with glow effects
- `premium` - Gradient gold with shimmer animation
- `glass` - Glassmorphism effect
- `outline` - Transparent with gold border
- `secondary` - Crystal teal variant
- `ghost` - Minimal hover effects
- `destructive` - Error rose red
- `link` - Text link style

### Card Variants

```tsx
// Glassmorphism card (default)
<Card variant="glass">Content</Card>

// Premium card with gold border and glow
<Card variant="premium">Content</Card>

// Elevated card with shadow
<Card variant="elevated">Content</Card>

// Standard card
<Card variant="default">Content</Card>
```

**Features:**
- Automatic hover animations
- Glassmorphism backdrop blur
- Smooth transitions
- Premium border effects

### Input Variants

```tsx
// Glassmorphism input
<Input variant="glass" placeholder="Enter text..." />

// Standard input with premium styling
<Input variant="default" placeholder="Enter text..." />
```

**Features:**
- Focus glow effects (Champagne Gold)
- Smooth scale animations
- Premium border styling
- Backdrop blur support

---

## ✨ Glassmorphism Effects

### CSS Classes

```css
/* Light mode glass */
.glass-light {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark mode glass */
.glass-dark {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Premium glass card */
.glass-card {
  @apply glass-effect rounded-xl p-6;
  /* Includes hover shine animation */
}
```

### Usage

```tsx
<div className="glass-card">
  {/* Content with automatic glassmorphism */}
</div>
```

---

## 🌈 Gradient Effects

### Text Gradients

```tsx
// Gold gradient text
<h1 className="gradient-text-gold">Premium Title</h1>

// Teal gradient text
<h2 className="gradient-text-teal">Secondary Title</h2>

// Animated shimmer gradient
<h3 className="gradient-text">Animated Text</h3>
```

### Background Gradients

```tsx
// Gold gradient background
<div className="gradient-bg-gold">Content</div>

// Teal gradient background
<div className="gradient-bg-teal">Content</div>
```

---

## 💫 Glow Effects

### CSS Classes

```css
/* Gold glow */
.glow-gold {
  box-shadow: 0 0 20px rgba(203, 161, 53, 0.4);
}

/* Teal glow */
.glow-teal {
  box-shadow: 0 0 20px rgba(46, 166, 233, 0.4);
}

/* Hover glow effects */
.glow-gold-hover:hover {
  box-shadow: 0 0 30px rgba(203, 161, 53, 0.6);
}
```

### Usage

```tsx
<div className="glow-gold-hover">
  {/* Hover to see gold glow */}
</div>
```

---

## 🎭 Animations & Micro-interactions

### Framer Motion Presets

```tsx
import { ANIMATIONS } from '@/lib/premium-styles';

// Fade in animation
<motion.div {...ANIMATIONS.fadeIn}>
  Content
</motion.div>

// Scale in animation
<motion.div {...ANIMATIONS.scaleIn}>
  Content
</motion.div>
```

### Hover Effects

```tsx
// Lift on hover
<div className="hover-lift">Content</div>

// Glow on hover
<div className="hover-glow">Content</div>

// Scale on hover (built into Button)
<Button>Hover me</Button>
```

### Custom Animations

```css
/* Shimmer effect */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Float animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

---

## 🎯 Design Principles

### 1. **Minimal Luxury**
- Clean, uncluttered interfaces
- Generous white space
- Premium typography hierarchy
- Sophisticated color choices

### 2. **Futuristic Glassmorphism**
- Frosted glass effects with backdrop blur
- Layered depth with transparency
- Subtle borders and shadows
- Modern, cutting-edge aesthetic

### 3. **Smooth Interactions**
- All transitions use cubic-bezier easing
- Micro-interactions on hover, focus, and click
- Scale and lift effects for depth
- Glow effects for emphasis

### 4. **Premium Details**
- Gold accents for important actions
- Teal highlights for secondary elements
- Status colors for clear feedback
- Consistent spacing and alignment

---

## 📱 Responsive Design

All components are fully responsive with:
- Mobile-first approach
- Touch-friendly interactions (44px minimum)
- Adaptive layouts
- Optimized for all screen sizes

---

## 🌓 Dark Mode

The design system fully supports dark mode with:
- Automatic theme detection
- Smooth theme transitions
- Optimized contrast ratios
- Glassmorphism adapted for dark backgrounds

---

## 🚀 Usage Examples

### Premium Dashboard Card

```tsx
<Card variant="premium" hover>
  <CardHeader>
    <CardTitle className="gradient-text-gold">
      Premium Feature
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content with glassmorphism effect</p>
  </CardContent>
</Card>
```

### Premium Action Button

```tsx
<Button 
  variant="premium" 
  className="glow-gold-hover"
>
  <Sparkles className="w-4 h-4 mr-2" />
  Premium Action
</Button>
```

### Glassmorphism Input Form

```tsx
<div className="glass-card p-6 space-y-4">
  <Input 
    variant="glass" 
    placeholder="Enter your name"
  />
  <Button variant="premium">
    Submit
  </Button>
</div>
```

---

## 🎨 Utility Functions

```tsx
import { getPremiumClasses } from '@/lib/premium-styles';

// Get combined premium classes
const classes = getPremiumClasses(
  'premium',  // variant
  'gold',     // glow
  'gold'      // gradient
);
```

---

## 📚 Component Reference

### Button
- **File:** `src/components/ui/Button.tsx`
- **Variants:** default, premium, glass, outline, secondary, ghost, destructive, link
- **Sizes:** default, sm, lg, icon

### Card
- **File:** `src/components/ui/Card.tsx`
- **Variants:** default, glass, premium, elevated
- **Props:** `hover` (boolean)

### Input
- **File:** `src/components/ui/Input.tsx`
- **Variants:** default, glass

---

## 💡 Best Practices

1. **Use glassmorphism sparingly** - Not every element needs glass effects
2. **Maintain contrast** - Ensure text is readable on glass backgrounds
3. **Consistent spacing** - Use the spacing scale consistently
4. **Smooth animations** - All animations should feel natural and responsive
5. **Premium accents** - Use gold for primary actions, teal for secondary
6. **Status colors** - Use semantic colors for feedback (success, warning, error)

---

## 🎬 Animation Guidelines

- **Duration:** 200-300ms for micro-interactions, 300-500ms for transitions
- **Easing:** Use `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- **Scale:** Hover scale should be subtle (1.02-1.05)
- **Glow:** Use glow effects to draw attention to important elements

---

## 🔧 Customization

All colors and effects can be customized via:
- Tailwind config (`tailwind.config.js`)
- CSS variables (`src/index.css`)
- Component props

---

**Remember:** This is a premium, high-end design system. Every detail matters. Think Apple × SpaceX in a luxury hotel lobby. Make it iconic. 💅✨

