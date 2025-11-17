# Frontend App Development Prompt Template

Copy and paste this template to build any frontend application using the UI/UX Build Plugin:

```
I want to build a [APP_TYPE] application using the UI/UX Build Plugin. Here are the requirements:

## App Overview
- **Name**: [APP_NAME]
- **Purpose**: [BRIEF_DESCRIPTION]
- **Target Users**: [TARGET_AUDIENCE]

## Features Required
1. [FEATURE_1]
2. [FEATURE_2]
3. [FEATURE_3]
- [Additional features...]

## Technical Requirements
- **Styling**: [tailwind|emotion|css-modules|styled-components]
- **State Management**: [react-state|zustand|redux|context]
- **Testing**: [unit|integration|e2e]
- **Authentication**: [none|firebase|auth0|custom]
- **Database**: [none|firebase|supabase|custom-api]
- **Deployment**: [vercel|netlify|aws|github-pages]

## Design System
- **Primary Color**: [COLOR_HEX]
- **Secondary Color**: [COLOR_HEX]
- **Typography**: [FONT_FAMILY]
- **Layout Type**: [dashboard|landing-page|mobile-first|desktop]

## Pages/Components Needed
1. [PAGE/COMPONENT_NAME] - [DESCRIPTION]
2. [PAGE/COMPONENT_NAME] - [DESCRIPTION]
3. [PAGE/COMPONENT_NAME] - [DESCRIPTION]

Please use the UI/UX Build Plugin to:
1. Set up the project structure and configuration
2. Generate all required components with parallel agents
3. Implement the design system and styling
4. Set up quality enforcement and testing
5. Create a production-ready build

Start by scaffolding the core components and then build out the features.
```

## Example: E-commerce App

```
I want to build a modern e-commerce product catalog application using the UI/UX Build Plugin. Here are the requirements:

## App Overview
- **Name**: ProductHub
- **Purpose**: A responsive product catalog with search, filtering, and shopping cart functionality
- **Target Users**: Online shoppers, product managers

## Features Required
1. Product listing page with grid/list view toggle
2. Product search with real-time filtering
3. Product detail page with image gallery
4. Shopping cart with add/remove items
5. Product category navigation
6. User authentication (login/register)
7. Order history page
8. Responsive design for mobile and desktop

## Technical Requirements
- **Styling**: tailwind
- **State Management**: zustand
- **Testing**: unit,integration
- **Authentication**: firebase
- **Database**: firebase-firestore
- **Deployment**: vercel

## Design System
- **Primary Color**: #3b82f6 (blue)
- **Secondary Color**: #10b981 (green)
- **Typography**: Inter font family
- **Layout Type**: mobile-first

## Pages/Components Needed
1. Header - Navigation bar with search and cart
2. ProductCard - Product display card with image, title, price
3. ProductGrid - Grid layout for product listings
4. ProductDetail - Detailed product view with gallery
5. SearchBar - Search input with autocomplete
6. FilterSidebar - Category and price filter controls
7. ShoppingCart - Cart items management
8. LoginForm - User authentication form
9. ProductCarousel - Featured products carousel

Please use the UI/UX Build Plugin to:
1. Set up the project structure and configuration
2. Generate all required components with parallel agents
3. Implement the design system and styling
4. Set up quality enforcement and testing
5. Create a production-ready build

Start by scaffolding the core components and then build out the features.
```

## Expected Plugin Commands

The plugin will automatically execute these commands:

```bash
# Component scaffolding
/scaffold-component Header --type functional --styling tailwind --tests unit,integration
/scaffold-component ProductCard --type functional --styling tailwind --tests unit
/scaffold-component ProductGrid --type functional --styling tailwind --tests unit,integration

# Quality enforcement
/lint-fix-all --fix --type-check --verbose
/run-tests --coverage --reporter=verbose

# Design system
/tailwind-config update --validate --backup
/design-tokens update --primary-color "#3b82f6"
```

## Results

- **⚡ 3.6x Faster Development**: Parallel agent orchestration
- **🎯 95% Quality Automation**: Near-zero manual fixes needed
- **💰 40% Cost Reduction**: Optimized AI model usage
- **📱 Production Ready**: Comprehensive testing and deployment