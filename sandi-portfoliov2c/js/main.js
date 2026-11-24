(() => {
  const year = document.querySelector("#current-year");
  if (year) year.textContent = new Date().getFullYear();
  console.info("Sandi Portfolio initialized.");
})();
