import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./index.css";
import "./i18n";
import { loadFacebookSdk } from "./lib/facebookSdk";

createRoot(document.getElementById("root")!).render(<App />);

// Carrega o SDK do Facebook (assíncrono, não bloqueia a renderização)
loadFacebookSdk();

