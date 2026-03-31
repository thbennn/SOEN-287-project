document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Dark mode toggle
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    // Load saved preference
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode",
        document.body.classList.contains("dark-mode")
      );
    });
  }
});