document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

document.querySelectorAll("nav").forEach((nav) => {
  const links = nav.querySelector(".nav-links");
  if (!links) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activeGroups = {
    "about.html": ["about.html", "history.html", "association-overview.html", "gallery.html"],
    "news-information.html": ["news-information.html", "neighbor-update.html", "garage-sale.html", "new-neighbor.html", "local-resources.html"],
    "community.html": [
      "community.html",
      "services.html",
      "garage-sale.html",
      "garden-campaign.html",
      "halloween.html",
      "picnic-fund.html",
      "snow-removal-fund.html",
    ],
    "documents.html": ["documents.html"],
    "support.html": ["support.html"],
  };
  const primaryLinks = [
    ["about.html", "About"],
    ["news-information.html", "News & Information"],
    ["community.html", "Community"],
    ["documents.html", "Documents"],
    ["support.html", "Support"],
  ];
  links.replaceChildren(...primaryLinks.map(([href, label]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (activeGroups[href].includes(currentPage)) link.classList.add("active");
    return link;
  }));

  const button = document.createElement("button");
  button.className = "nav-toggle";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open navigation");
  button.innerHTML = "<span></span><span></span><span></span>";
  nav.insertBefore(button, links);

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });

  links.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    nav.classList.remove("nav-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation");
  });
});
