/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    borderColor: {
      primary: "#4a90e2",
      secondary: "#d0021b",
      tertiary: "#f5a623",
    },
    extend: {
      spacing: {
        "extra-wide": "40rem",
      },
      borderRadius: {
        "extra-large": "1.5rem",
      },
    },
  },
};
