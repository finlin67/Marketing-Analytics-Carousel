# Marketing Analytics Carousel

A premium, high-fidelity marketing analytics dashboard prototype. This project demonstrates a "living" UI component designed as a 1:1 square tile, featuring a rotating 3D KPI carousel, real-time simulated data streams, and organic sparkline visualizations using Framer Motion.

## Features

- **1:1 Square Layout**: Optimized for modern grid dashboards, presenting a dense hierarchy of information in a 600x600 container.
- **3D KPI Carousel**: A rotating deck of cards displaying key performance indicators (Conversion Rate, Cost per Lead, Retention Lift). It uses depth sorting, scale, blur, and opacity to create a realistic 3D stacking effect.
- **Organic Sparkline**: A background visualization driven by complex sine wave algorithms to create a fluid, non-repetitive, organic data graph.
- **Real-time Data Simulation**: The dashboard simulates a live connection, constantly updating metrics like leads, MQLs, and ROI to demonstrate reactive UI capabilities.
- **Premium Aesthetics**: Built with a "SaaS Premium" dark mode aesthetic, utilizing glassmorphism, backdrop filters, and refined Inter typography.

## Tech Stack

- **React 19**: Modern component architecture.
- **Framer Motion 12**: Powering the complex physics-based animations (carousel rotation, sparkline paths, progress bars).
- **Tailwind CSS**: Utility-first styling for rapid, consistent design implementation.
- **TypeScript**: Ensuring type safety across state management and data structures.

## Structure

- **`Marketing-Automation-Carousel.tsx`**: Contains the core application logic, including the data simulation loop (`useEffect`), the math for the organic sparkline generation, and the main UI render tree.
- **`index.tsx`**: The entry point that mounts the React application to the DOM.
- **`index.html`**: The document shell, handling external dependencies (via `esm.sh` import maps) and Tailwind CSS (via CDN).

## Usage

This project uses an ES Module (ESM) architecture via `importmap` in `index.html`. It is designed to run instantly in modern browser environments or lightweight development servers without a complex build step.

To extend the project:
1.  **Modify KPIs**: Edit the `KPI_DEFS` array in `Marketing-Automation-Carousel.tsx` to change the cards in the carousel.
2.  **Adjust Speed**: Tweak the `setTimeout` intervals in the `loop` function to change the pacing of data updates.
3.  **Customize Visuals**: Update the Tailwind classes in the `getPositionConfig` function to alter the 3D depth effect (scale, blur, opacity).