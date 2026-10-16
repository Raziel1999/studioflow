const serviceCards = document.querySelectorAll(".service-card");
const dateList = document.querySelector("#date-list");
const timeList = document.querySelector("#time-list");
const selectedDateLabel = document.querySelector("#selected-date-label");
const bookingForm = document.querySelector("#booking-form");
const submitButton = document.querySelector("#submit-button");
const formError = document.querySelector("#form-error");
const confirmationDialog = document.querySelector("#confirmation-dialog");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

const booking = {
  service: null,
  price: null,
  date: null,
  time: null,
};

const dayNames = ["ned", "pon", "uto", "sri", "čet", "pet", "sub"];
const monthNames = [
  "siječnja", "veljače", "ožujka", "travnja", "svibnja", "lipnja",
  "srpnja", "kolovoza", "rujna", "listopada", "studenoga", "prosinca",
];
const availableTimes = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:00"];

function formatDate(date) {
  return `${date.getDate()}. ${monthNames[date.getMonth()]}`;
}

function createDateOptions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-button";
    button.dataset.date = date.toISOString();
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="date-weekday">${offset === 0 ? "Danas" : dayNames[date.getDay()]}</span><span class="date-day">${date.getDate()}.</span>`;
    button.addEventListener("click", () => selectDate(button, date));
    dateList.append(button);
  }
}

function selectDate(button, date) {
  dateList.querySelectorAll(".date-button").forEach((option) => {
    option.classList.remove("selected");
    option.setAttribute("aria-pressed", "false");
  });
  button.classList.add("selected");
  button.setAttribute("aria-pressed", "true");
  booking.date = date;
  booking.time = null;
  selectedDateLabel.textContent = formatDate(date);
  document.querySelector("#summary-datetime").textContent = "Odaberi vrijeme";
  renderTimes();
  updateSubmitButton();
}

function renderTimes() {
  timeList.replaceChildren();

  availableTimes.forEach((time, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-button";
    button.textContent = time;
    button.setAttribute("aria-pressed", "false");

    if ((booking.date.getDate() + index) % 8 === 0) {
      button.disabled = true;
      button.setAttribute("aria-label", `${time}, zauzeto`);
      button.classList.add("unavailable");
    } else {
      button.addEventListener("click", () => selectTime(button, time));
    }

    timeList.append(button);
  });
}

function selectTime(button, time) {
  timeList.querySelectorAll(".time-button").forEach((option) => {
    option.classList.remove("selected");
    option.setAttribute("aria-pressed", "false");
  });
  button.classList.add("selected");
  button.setAttribute("aria-pressed", "true");
  booking.time = time;
  document.querySelector("#summary-datetime").textContent = `${formatDate(booking.date)} · ${time}`;
  updateSubmitButton();
}

function updateSubmitButton() {
  submitButton.disabled = !(booking.service && booking.date && booking.time);
}

serviceCards.forEach((card) => {
  card.setAttribute("aria-pressed", "false");
  card.addEventListener("click", () => {
    serviceCards.forEach((option) => {
      option.classList.remove("selected");
      option.setAttribute("aria-pressed", "false");
    });
    card.classList.add("selected");
    card.setAttribute("aria-pressed", "true");
    booking.service = card.dataset.service;
    booking.price = Number(card.dataset.price);
    document.querySelector("#summary-service").textContent = booking.service;
    document.querySelector("#summary-price").textContent = booking.price === 0 ? "Besplatno" : `${booking.price} €`;
    updateSubmitButton();
  });
});

document.querySelector('[name="stylist"]').addEventListener("change", (event) => {
  document.querySelector("#summary-stylist").textContent = event.target.value;
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!booking.service || !booking.date || !booking.time) {
    formError.textContent = "Odaberi uslugu, datum i vrijeme prije potvrde rezervacije.";
    formError.hidden = false;
    return;
  }

  const formData = new FormData(bookingForm);
  const name = formData.get("name").trim();
  const firstName = name.split(/\s+/)[0];
  const stylist = formData.get("stylist");
  document.querySelector("#confirmation-name").textContent = firstName;
  document.querySelector("#confirmation-details").textContent =
    `${booking.service} · ${formatDate(booking.date)} u ${booking.time} · ${stylist}. Ukupno: ${booking.price === 0 ? "besplatno" : `${booking.price} €`}.`;
  confirmationDialog.showModal();
});

function closeConfirmation() {
  confirmationDialog.close();
  bookingForm.reset();
  booking.service = null;
  booking.price = null;
  booking.date = null;
  booking.time = null;
  serviceCards.forEach((card) => {
    card.classList.remove("selected");
    card.setAttribute("aria-pressed", "false");
  });
  dateList.querySelectorAll(".date-button").forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  timeList.replaceChildren(Object.assign(document.createElement("p"), {
    className: "empty-times",
    textContent: "Odaberi datum da vidiš slobodne termine.",
  }));
  selectedDateLabel.textContent = "Prvo odaberi dan";
  document.querySelector("#summary-service").textContent = "Odaberi uslugu";
  document.querySelector("#summary-datetime").textContent = "Odaberi termin";
  document.querySelector("#summary-stylist").textContent = "Bilo tko iz tima";
  document.querySelector("#summary-price").textContent = "—";
  formError.hidden = true;
  updateSubmitButton();
}

document.querySelector(".dialog-close").addEventListener("click", closeConfirmation);
document.querySelector(".dialog-done").addEventListener("click", closeConfirmation);
confirmationDialog.addEventListener("click", (event) => {
  if (event.target === confirmationDialog) closeConfirmation();
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Otvori navigaciju" : "Zatvori navigaciju");
  mainNav.classList.toggle("open", !isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otvori navigaciju");
  });
});

createDateOptions();
