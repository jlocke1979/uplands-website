document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", async () => {
    const link = button.dataset.copyLink;
    const status = button.closest("section")?.querySelector("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(link);
      if (status) status.textContent = "Page link copied.";
      button.textContent = "Copied!";
      window.setTimeout(() => {
        button.textContent = "Copy page link";
        if (status) status.textContent = "";
      }, 2400);
    } catch {
      if (status) status.textContent = `Copy this link: ${link}`;
    }
  });
});

document.querySelectorAll("nav").forEach((nav) => {
  const links = nav.querySelector(".nav-links");
  if (!links) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activeGroups = {
    "about.html": ["about.html", "history.html", "association-overview.html"],
    "news-information.html": ["news-information.html", "neighbor-update.html", "garage-sale.html", "new-neighbor.html", "local-resources.html"],
    "calendar.html": ["calendar.html"],
    "community.html": [
      "community.html",
      "block-parties.html",
      "services.html",
      "garage-sale.html",
      "garden-campaign.html",
      "halloween.html",
      "picnic-fund.html",
      "snow-removal-fund.html",
    ],
    "documents.html": ["documents.html"],
    "gallery.html": ["gallery.html", "a-view-from-the-uplands.html"],
    "support.html": ["support.html"],
  };
  const primaryLinks = [
    ["about.html", "About"],
    ["news-information.html", "News & Information"],
    ["calendar.html", "Calendar"],
    ["community.html", "Community"],
    ["documents.html", "Documents"],
    ["gallery.html", "Gallery"],
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

// Paste the public Google Calendar ID between the quotation marks.
// Find it in Google Calendar: Settings > Integrate calendar > Calendar ID.
const publicCalendarId = "admin@theuplandspeoria.org";

document.querySelectorAll("[data-calendar-shell]").forEach((shell) => {
  if (!publicCalendarId) return;

  const calendarUrl = new URL("https://calendar.google.com/calendar/embed");
  calendarUrl.searchParams.set("src", publicCalendarId);
  calendarUrl.searchParams.set("ctz", "America/Chicago");
  calendarUrl.searchParams.set("mode", "AGENDA");
  calendarUrl.searchParams.set("showTitle", "0");
  calendarUrl.searchParams.set("showPrint", "0");
  calendarUrl.searchParams.set("showCalendars", "0");

  const frame = document.createElement("iframe");
  frame.className = "calendar-frame";
  frame.src = calendarUrl.toString();
  frame.title = "Uplands neighborhood events calendar";
  frame.loading = "lazy";
  frame.setAttribute("frameborder", "0");
  frame.setAttribute("scrolling", "no");

  shell.replaceChildren(frame);
});
