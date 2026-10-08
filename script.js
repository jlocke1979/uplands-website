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
      "garden.html",
      "halloween.html",
      "picnic.html",
      "snow-removal-fund.html",
    ],
    "documents.html": ["documents.html"],
    "gallery.html": ["gallery.html", "a-view-from-the-uplands.html", "picture-of-the-month.html", "photo-submissions.html"],
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
  calendarUrl.searchParams.set("mode", "MONTH");
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

// Keep keyboard and assistive-technology navigation inside the active viewer.
const photoDialogStack = [];
const photoDialogInertState = new Map();
const syncPhotoDialogs = () => {
  const active = photoDialogStack.at(-1);
  for (const child of document.body.children) {
    if (!photoDialogInertState.has(child)) photoDialogInertState.set(child, child.inert);
    child.inert = active ? child !== active : photoDialogInertState.get(child);
  }
  if (!active) photoDialogInertState.clear();
};
const activatePhotoDialog = (dialog) => {
  photoDialogStack.push(dialog);
  syncPhotoDialogs();
};
const deactivatePhotoDialog = (dialog) => {
  const index = photoDialogStack.lastIndexOf(dialog);
  if (index !== -1) photoDialogStack.splice(index, 1);
  syncPhotoDialogs();
};
document.addEventListener("keydown", (event) => {
  const dialog = photoDialogStack.at(-1);
  if (!dialog || event.key !== "Tab") return;
  const controls = [...dialog.querySelectorAll('button, a[href], [tabindex="0"]')]
    .filter((element) => !element.disabled && element.getClientRects().length);
  if (!controls.length) return;
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

// Gallery image lightbox with scroll/pinch zoom
(() => {
  const minScale = 1;
  const maxScale = 4;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button type="button" class="lightbox-close" aria-label="Close photo viewer">&times;</button>
      <div class="lightbox-image-wrap">
        <img class="lightbox-image" alt="" draggable="false">
      </div>
      <div class="lightbox-panel">
        <p class="lightbox-caption"></p>
        <a class="button button--dark lightbox-fullsize" target="_blank" rel="noopener">View full size</a>
      </div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const backdrop = lightbox.querySelector(".lightbox-backdrop");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const imageWrap = lightbox.querySelector(".lightbox-image-wrap");
  const image = lightbox.querySelector(".lightbox-image");
  const caption = lightbox.querySelector(".lightbox-caption");
  const fullsizeLink = lightbox.querySelector(".lightbox-fullsize");

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let lastFocused = null;
  let closeTimer = null;

  const clampScale = (value) => Math.min(maxScale, Math.max(minScale, value));

  const applyTransform = () => {
    image.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    imageWrap.classList.toggle("zoomed", scale > minScale);
  };

  const setScale = (nextScale) => {
    scale = clampScale(nextScale);
    if (scale === minScale) {
      originX = 0;
      originY = 0;
    }
    applyTransform();
  };

  const resetZoom = () => {
    scale = 1;
    originX = 0;
    originY = 0;
    applyTransform();
  };

  const openLightbox = (link) => {
    const img = link.querySelector("img");
    if (!img) return;
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement;
    image.src = link.href;
    image.alt = img.alt || "";
    const credit = link.querySelector(".gallery-photo-credit")?.textContent.trim();
    caption.textContent = [img.alt, credit].filter(Boolean).join(" — ");
    fullsizeLink.href = link.href;
    resetZoom();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    requestAnimationFrame(() => lightbox.classList.add("open"));
    activatePhotoDialog(lightbox);
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.classList.remove("lightbox-open");
    deactivatePhotoDialog(lightbox);
    isDragging = false;
    imageWrap.classList.remove("dragging");
    closeTimer = window.setTimeout(() => {
      lightbox.hidden = true;
      image.src = "";
    }, 200);
    if (lastFocused) lastFocused.focus();
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.gallery-item");
    if (!link) return;
    event.preventDefault();
    openLightbox(link);
  });

  backdrop.addEventListener("click", closeLightbox);
  closeButton.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden || event.key !== "Escape") return;
    event.stopImmediatePropagation();
    closeLightbox();
  });

  // Desktop: scroll/wheel to zoom
  imageWrap.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setScale(scale * zoomFactor);
  }, { passive: false });

  // Desktop: drag to pan once zoomed in
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  imageWrap.addEventListener("mousedown", (event) => {
    if (scale <= minScale) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = originX;
    dragOriginY = originY;
    imageWrap.classList.add("dragging");
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    originX = dragOriginX + (event.clientX - dragStartX);
    originY = dragOriginY + (event.clientY - dragStartY);
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    imageWrap.classList.remove("dragging");
  });

  // Mobile: pinch to zoom, single-finger drag to pan once zoomed in
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchOriginX = 0;
  let touchOriginY = 0;

  const touchDistance = (touches) => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

  imageWrap.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      pinchStartDistance = touchDistance(event.touches);
      pinchStartScale = scale;
    } else if (event.touches.length === 1 && scale > minScale) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchOriginX = originX;
      touchOriginY = originY;
    }
  }, { passive: true });

  imageWrap.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      setScale(pinchStartScale * (distance / pinchStartDistance));
    } else if (event.touches.length === 1 && scale > minScale) {
      event.preventDefault();
      originX = touchOriginX + (event.touches[0].clientX - touchStartX);
      originY = touchOriginY + (event.touches[0].clientY - touchStartY);
      applyTransform();
    }
  }, { passive: false });

  // Rebase the remaining finger after a pinch so the image does not jump.
  imageWrap.addEventListener("touchend", (event) => {
    if (event.touches.length === 1) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchOriginX = originX;
      touchOriginY = originY;
    }
  });

  image.addEventListener("dblclick", () => {
    setScale(scale > minScale ? 1 : 2);
  });
})();

// Monthly photo spotlight archive (placeholder data until real winners are chosen)
(() => {
  const grid = document.querySelector("[data-month-grid]");
  if (!grid) return;

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

  const PLACEHOLDER_IMAGES = [
    "assets/images/gallery/370200587_870606807759681_210162988387038657_n.jpg",
    "assets/images/gallery/370284342_3724934461074046_4475135608361034929_n.jpg",
    "assets/images/gallery/370288914_343897248176822_4017444663952019519_n.jpg",
    "assets/images/gallery/387524236_654603430138371_8893289489707215956_n.jpg",
    "assets/images/gallery/393069102_852196503037291_2594759480600169748_n.jpg",
    "assets/images/gallery/393239159_832398685026651_940337507189797651_n.jpg",
    "assets/images/gallery/393239160_1048998059878200_1765748896183752875_n.jpg",
    "assets/images/gallery/393317372_156920570831181_316524598836203724_n.jpg",
    "assets/images/gallery/393441815_1036597244320316_8906372888410770643_n.jpg",
    "assets/images/gallery/393441822_1001897891131364_6273993662342847778_n.jpg",
    "assets/images/gallery/393462541_1014906179809474_5199457459963997106_n.jpg",
    "assets/images/gallery/IMG_0650.JPG.jpeg",
    "assets/images/gallery/IMG_1450.jpeg",
    "assets/images/gallery/IMG_1564_VSCO.JPG.jpeg",
    "assets/images/gallery/IMG_2232.jpeg",
    "assets/images/gallery/IMG_6191.jpeg",
    "assets/images/gallery/IMG_6194.jpeg",
    "assets/images/gallery/IMG_6196.jpeg",
    "assets/images/gallery/IMG_6401.JPG.jpeg",
    "assets/images/gallery/IMG_6482_VSCO.JPG.jpeg",
    "assets/images/gallery/IMG_8886.jpeg",
    "assets/images/gallery/blue-door.jpg",
    "assets/images/gallery/flower-pinwheel.jpg",
    "assets/images/gallery/hero-fall-frame-houses.jpg",
    "assets/images/gallery/plant-drop-house.jpg",
    "assets/images/gallery/porch-light.jpg",
    "assets/images/gallery/sunset-fence.jpg",
    "assets/images/gallery/sunset-lamp.jpg",
    "assets/images/gallery/sunset-stop-sign.jpg",
    "assets/images/gallery/sunset-waves.jpg",
  ];

  const currentMonthLabel = document.querySelector("[data-current-month]");
  if (currentMonthLabel) currentMonthLabel.textContent = MONTHS[new Date().getMonth()];

  const imageFor = (monthIndex, yearIndex) =>
    PLACEHOLDER_IMAGES[(monthIndex * YEARS.length + yearIndex) % PLACEHOLDER_IMAGES.length];

  const modal = document.createElement("div");
  modal.className = "month-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="month-modal-backdrop"></div>
    <div class="month-modal-content" role="dialog" aria-modal="true" aria-label="Monthly photo spotlight winners">
      <button type="button" class="month-modal-close" aria-label="Close">&times;</button>
      <h2 class="month-modal-title"></h2>
      <p class="month-modal-subtitle">Placeholder photographs shown here — annual winners will replace these as they're selected.</p>
      <div class="month-modal-grid"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const backdrop = modal.querySelector(".month-modal-backdrop");
  const closeButton = modal.querySelector(".month-modal-close");
  const title = modal.querySelector(".month-modal-title");
  const winnersGrid = modal.querySelector(".month-modal-grid");

  let lastFocused = null;
  let closeTimer = null;

  const closeModal = () => {
    modal.classList.remove("open");
    document.body.classList.remove("month-modal-open");
    deactivatePhotoDialog(modal);
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
    }, 200);
    if (lastFocused) lastFocused.focus();
  };

  const openModal = (monthIndex) => {
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement;
    title.textContent = `${MONTHS[monthIndex]} winners`;
    winnersGrid.replaceChildren(...YEARS.map((year, yearIndex) => {
      const link = document.createElement("a");
      link.className = "gallery-item month-winner";
      link.href = imageFor(monthIndex, yearIndex);

      const img = document.createElement("img");
      img.src = link.href;
      img.alt = `${MONTHS[monthIndex]} ${year} photo spotlight winner (placeholder)`;

      const yearTag = document.createElement("span");
      yearTag.className = "month-winner-year";
      yearTag.textContent = year;

      link.append(img, yearTag);
      return link;
    }));
    modal.hidden = false;
    document.body.classList.add("month-modal-open");
    requestAnimationFrame(() => modal.classList.add("open"));
    activatePhotoDialog(modal);
    closeButton.focus();
  };

  backdrop.addEventListener("click", closeModal);
  closeButton.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (modal.hidden || event.key !== "Escape") return;
    closeModal();
  });

  grid.replaceChildren(...MONTHS.map((month, monthIndex) => {
    const latestYearIndex = YEARS.length - 1;
    const src = imageFor(monthIndex, latestYearIndex);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "month-card";
    card.setAttribute("aria-haspopup", "dialog");
    card.innerHTML = `
      <span class="month-card-thumb">
        <img src="${src}" alt="${month} ${YEARS[latestYearIndex]} photo spotlight winner (placeholder)">
        <span class="month-card-year">${YEARS[latestYearIndex]}</span>
      </span>
      <span class="month-card-label">${month}</span>
    `;
    card.addEventListener("click", () => openModal(monthIndex));
    return card;
  }));
})();
