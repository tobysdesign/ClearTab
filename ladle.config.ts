import path from "path";

const config = {
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "@cleartab/ui": path.resolve(__dirname, "packages/ui/src"),
      },
    },
  },
};

export default config;
