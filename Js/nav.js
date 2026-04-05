document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Hide Admin nav link for non-admin users
  fetch("/api/auth/me")
    .then((res) => res.json())
    .then((data) => {
      if (data.role !== "admin") {
        const adminLink = document.getElementById("admin-nav-link");
        if (adminLink) adminLink.style.display = "none";
      }
    })
    .catch(() => {}); // silently fail if not logged in

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