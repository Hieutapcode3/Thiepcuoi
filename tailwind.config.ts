import type { Config } from "tailwindcss";

// Mẫu "Minimalism đỏ đậm": đỏ rượu vang + kem giấy + vàng đồng
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: "#511419",      // đỏ rượu chủ đạo (chữ, nút, khối)
        "wine-deep": "#380a0e",
        "wine-mid": "#6e1a20",
        rose: "#8b3a44",
        crimson: "#a8323b",
        gold: "#c9a24a",
        cream: "#ece4d8",     // chữ trên nền đỏ, thẻ kem
        paper: "#f3ece0",     // nền trang
      },
      fontFamily: {
        viaoda: ['"Viaoda Libre"', '"EB Garamond"', "serif"],
        script: ['"Pinyon Script"', '"Great Vibes"', "cursive"],
        name: ['"EB Garamond"', '"Times New Roman"', "serif"],
        body: ['"Libre Baskerville"', "Baskerville", '"Times New Roman"', "serif"],
        cormorant: ['"Cormorant Garamond"', '"Times New Roman"', "serif"],
        nautigal: ['"The Nautigal"', '"Pinyon Script"', "cursive"],
        head: ['"Times New Roman"', "Times", "serif"],
        button: ["Lora", "serif"],
        ui: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
