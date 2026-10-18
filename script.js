const serviceCards = document.querySelectorAll(".service-card");
const dateList = document.querySelector("#date-list");
const timeList = document.querySelector("#time-list");
const selectedDateLabel = document.querySelector("#selected-date-label");
const bookingForm = document.querySelector("#booking-form");
const submitButton = document.querySelector("#submit-button");
const formError = document.querySelector("#form-error");
const confirmationDialog = document.querySelector("#confirmation-dialog");
const demo = window.StudioflowDemo;

const booking = {
  service: null,
  price: null,
  duration: null,
  category: null,
  date: null,
  time: null,
};

const dayNames = ["ned", "pon", "uto", "sri", "čet", "pet", "sub"];
const fullDayNames = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
const monthNames = [
  "siječnja", "veljače", "ožujka", "travnja", "svibnja", "lipnja",
  "srpnja", "kolovoza", "rujna", "listopada", "studenoga", "prosinca",
];
const availableTimes = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:00"];

function formatDate(date) {
  return `${date.getDate()}. ${monthNames[date.getMonth()]}`;
}

function timeInMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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
    button.dataset.date = demo.dateKey(date);
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `${offset === 0 ? "Danas" : fullDayNames[date.getDay()]}, ${date.getDate()}. ${monthNames[date.getMonth()]}`);
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

  let reservations;
  try {
    reservations = demo.getReservations();
  } catch {
    formError.textContent = "Nije moguće pročitati demo rezervacije. Provjeri pohranu preglednika.";
    formError.hidden = false;
    return;
  }

  availableTimes.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-button";
    button.textContent = time;
    button.setAttribute("aria-pressed", "false");

    const candidate = {
      date: demo.dateKey(booking.date),
      time,
      duration: booking.duration || 30,
    };
    const isPast = candidate.date === demo.dateKey(new Date())
      && new Date(`${candidate.date}T${time}:00`) <= new Date();
    const outsideOpeningHours = timeInMinutes(time) + candidate.duration + demo.cleanupMinutes > 19 * 60;
    const selectedStylist = bookingForm.elements.stylist.value;
    const assignedStylist = selectedStylist === "Bilo tko iz tima"
      ? demo.findAvailableStylist(candidate, reservations)
      : selectedStylist;
    if (isPast || outsideOpeningHours || !assignedStylist || demo.hasConflict({ ...candidate, stylist: assignedStylist }, reservations)) {
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
    booking.duration = Number(card.dataset.duration);
    booking.category = card.dataset.category || "Ostalo";
    document.querySelector("#summary-service").textContent = booking.service;
    document.querySelector("#summary-price").textContent = booking.price === 0 ? "Besplatno" : `${booking.price} €`;
    if (booking.date) {
      booking.time = null;
      document.querySelector("#summary-datetime").textContent = "Odaberi vrijeme";
      renderTimes();
    }
    updateSubmitButton();
  });
});

document.querySelector('[name="stylist"]').addEventListener("change", (event) => {
  document.querySelector("#summary-stylist").textContent = event.target.value;
  if (booking.date) {
    booking.time = null;
    document.querySelector("#summary-datetime").textContent = "Odaberi vrijeme";
    renderTimes();
    updateSubmitButton();
  }
});

function getClientSession() {
  try {
    const session = demo.getSession();
    return session && session.role === "user" ? session : null;
  } catch {
    return null;
  }
}

const clientSession = getClientSession();
const loginNote = document.querySelector("#booking-login-note");
if (clientSession) {
  bookingForm.elements.name.value = clientSession.name;
  bookingForm.elements.email.value = clientSession.email;
  loginNote.textContent = `Prijavljeni ste kao ${clientSession.email}.`;
} else {
  loginNote.textContent = "Za spremanje rezervacije prijavi se kao demo klijent. ";
  const loginLink = document.createElement("a");
  loginLink.href = "prijava.html";
  loginLink.textContent = "Prijava za klijente";
  loginNote.append(loginLink);
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!booking.service || !booking.date || !booking.time) {
    formError.textContent = "Odaberi uslugu, datum i vrijeme prije potvrde rezervacije.";
    formError.hidden = false;
    return;
  }

  const session = getClientSession();
  if (!session) {
    formError.textContent = "Za rezervaciju se moraš prijaviti kao demo klijent. Admin račun ne može stvarati klijentske rezervacije.";
    formError.hidden = false;
    return;
  }

  const formData = new FormData(bookingForm);
  const name = String(formData.get("name")).trim();
  const email = String(formData.get("email")).trim().toLowerCase();
  if (email !== session.email) {
    formError.textContent = "E-mail rezervacije mora odgovarati prijavljenom demo klijentskom računu.";
    formError.hidden = false;
    return;
  }

  const requestedStylist = String(formData.get("stylist"));
  const reservation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientName: name,
    clientEmail: session.email,
    phone: String(formData.get("phone")).trim(),
    service: booking.service,
    category: booking.category,
    price: booking.price,
    duration: booking.duration,
    date: demo.dateKey(booking.date),
    time: booking.time,
    stylist: requestedStylist === "Bilo tko iz tima"
      ? demo.findAvailableStylist({
        date: demo.dateKey(booking.date),
        time: booking.time,
        duration: booking.duration,
        stylist: requestedStylist,
      })
      : requestedStylist,
    note: String(formData.get("note")).trim(),
    status: "booked",
    createdAt: new Date().toISOString(),
  };
  if (!reservation.stylist) {
    formError.textContent = "Nijedna djelatnica nije dostupna u tom terminu s potrebnim vremenom za pospremanje i odmor.";
    formError.hidden = false;
    renderTimes();
    return;
  }
  reservation.cleanupMinutes = demo.cleanupMinutes;
  reservation.breakMinutes = demo.breakMinutes;

  try {
    demo.saveReservation(reservation);
  } catch (error) {
    formError.textContent = error.message || "Rezervaciju nije moguće spremiti u pohranu ovog preglednika.";
    formError.hidden = false;
    if (booking.date) renderTimes();
    return;
  }

  document.querySelector("#confirmation-name").textContent = name.split(/\s+/)[0];
  document.querySelector("#confirmation-details").textContent =
    `${booking.service} · ${formatDate(booking.date)} u ${booking.time} · ${reservation.stylist}. Ukupno: ${booking.price === 0 ? "besplatno" : `${booking.price} €`}.`;
  confirmationDialog.showModal();
});

function closeConfirmation() {
  confirmationDialog.close();
  bookingForm.reset();
  booking.service = null;
  booking.price = null;
  booking.duration = null;
  booking.category = null;
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
  if (clientSession) {
    bookingForm.elements.name.value = clientSession.name;
    bookingForm.elements.email.value = clientSession.email;
  }
  formError.hidden = true;
  updateSubmitButton();
}

document.querySelector(".dialog-close").addEventListener("click", closeConfirmation);
document.querySelector(".dialog-done").addEventListener("click", closeConfirmation);
confirmationDialog.addEventListener("click", (event) => {
  if (event.target === confirmationDialog) closeConfirmation();
});
window.addEventListener("storage", (event) => {
  if (event.key === "studioflow-demo-reservations" && booking.date) renderTimes();
});

createDateOptions();
