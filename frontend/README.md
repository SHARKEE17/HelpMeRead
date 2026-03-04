# HelpMeRead - Frontend

**Turn static PDFs into flowing, interactive knowledge.**

This project is the frontend for **HelpMeRead**, a modern web application that transforms traditional PDF documents into engaging, interactive, and readable web articles. It reimagines the reading experience by combining the best features of e-readers (clean layouts, distraction-free modes) with the power of the web (instant context, AI explanations, collaborative notes).

## 🚀 Key Features

*   **PDF Transformation**: instantly converts dense PDF layouts into clean, responsive HTML articles.
*   **Kindle-Inspired Reading View**: A distraction-free "Reader Mode" with customizable typography (Serif/Sans) and themes (Light/Dark/Sepia).
*   **Smart Context (ELI5)**: Select any term to get an instant definition. Toggle between formal definitions and "Explain it to me like a 5-year-old" simplified explanations.
*   **Interactive Annotations**: 
    *   **Highlight**: Mark key passages easily.
    *   **Notes**: Add thoughts to specific text, which are saved to a dedicated sidebar.
    *   **Copy**: Smart clipboard feedback.
*   **Browser-in-Browser Mockup**: Demonstrates the seamless "no-app-needed" experience directly in the browser window.

## 🛠️ Technology Stack

*   **Framework**: [React](https://reactjs.org/) (TypeScript)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Material UI (MUI)](https://mui.com/) v5 with a custom premium theme.
*   **Icons**: MUI Icons Material.

## 📦 Installation & Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

## 📂 Project Structure

*   `src/components/LandingPage.tsx`: The main entry point showcasing the product vision, featuring high-fidelity interactive mockups (Reader View, Context Popovers).
*   `src/components/ReaderLayout.tsx`: Layout wrapper for the actual reading interface.
*   `src/theme.ts`: Custom MUI theme configuration for the "Substack-like" aesthetic.

---
*Designed to make reading complex documents as easy as browsing the web.*
