import "dotenv/config";
import { defineConfig } from "wxt";

const serverUrl = (process.env.WXT_SERVER_URL ?? "http://localhost:5000").replace(/\/+$/, "");

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "QR Box Reader",
    description: "Draw a box around a QR code on the page and read its link.",
    permissions: ["activeTab", "scripting"],
    host_permissions: [`${new URL(serverUrl).origin}/*`],
  },
  webExt: { disabled: true },
});