const dashboard = document.querySelector("[data-required-role]");
const requiredRole = dashboard.dataset.requiredRole;
let account;

try {
  account = JSON.parse(sessionStorage.getItem("studioflow-demo-session"));
} catch {
  account = null;
}

if (!account || account.role !== requiredRole) {
  window.location.replace("prijava.html");
} else {
  document.querySelector("#account-name").textContent = account.name;
  document.querySelector("#welcome-name").textContent = account.name.split(/\s+/)[0];

  const profileName = document.querySelector("#profile-name");
  const profileEmail = document.querySelector("#profile-email");
  if (profileName) profileName.textContent = account.name;
  if (profileEmail) profileEmail.textContent = account.email;

  renderReservations();
  window.addEventListener("storage", (event) => {
    if (event.key === "studioflow-demo-reservations") {
      renderReservations();
      if (requiredRole === "admin") {
        renderSchedule();
        updateAdminBookingTimes();
      }
    }
  });
  if (requiredRole === "admin") initializeAdminTools();
}

function dateTimeValue(reservation) {
  return new Date(`${reservation.date}T${reservation.time}:00`);
}

function formatReservationDate(reservation) {
  return new Intl.DateTimeFormat("hr-HR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${reservation.date}T12:00:00`));
}

function createReservationCard(reservation, isAdmin) {
  const card = document.createElement("article");
  card.className = "reservation-card";

  const date = document.createElement("div");
  date.className = "reservation-date";
  const time = document.createElement("strong");
  time.textContent = reservation.time;
  const day = document.createElement("span");
  day.textContent = formatReservationDate(reservation);
  date.append(time, day);

  const details = document.createElement("div");
  details.className = "reservation-details";
  const service = document.createElement("h3");
  service.textContent = reservation.service;
  const person = document.createElement("p");
  person.textContent = isAdmin
    ? `${reservation.clientName}${reservation.clientEmail ? ` · ${reservation.clientEmail}` : " · Interna rezervacija salona"} · ${reservation.stylist}`
    : `${reservation.category || "Usluga"} · ${reservation.stylist}`;
  details.append(service, person);
  if (isAdmin && reservation.phone) {
    const phone = document.createElement("p");
    phone.textContent = `Telefon: ${reservation.phone}`;
    details.append(phone);
  }
  if (reservation.note) {
    const note = document.createElement("p");
    note.className = "reservation-note";
    note.textContent = `Napomena: ${reservation.note}`;
    details.append(note);
  }

  const meta = document.createElement("div");
  meta.className = "reservation-meta";
  const price = document.createElement("strong");
  price.textContent = reservation.price === 0 ? "Besplatno" : `${reservation.price} €`;
  const status = document.createElement("span");
  status.className = "reservation-status";
  status.textContent = reservation.status === "cancelled" ? "Otkazano" : "Rezervirano";
  meta.append(price, status);

  card.append(date, details, meta);
  return card;
}

function initializeAdminTools() {
  const today = window.StudioflowDemo.dateKey(new Date());
  const scheduleDate = document.querySelector("#schedule-date");
  const bookingDate = document.querySelector("#admin-booking-date");
  const serviceSelect = document.querySelector("#admin-booking-service");
  const stylistSelect = document.querySelector("#admin-booking-stylist");

  scheduleDate.value = today;
  bookingDate.value = today;
  bookingDate.min = today;

  window.StudioflowDemo.services.forEach((service) => {
    let group = serviceSelect.querySelector(`optgroup[label="${service.category}"]`);
    if (!group) {
      group = document.createElement("optgroup");
      group.label = service.category;
      serviceSelect.append(group);
    }
    const option = document.createElement("option");
    option.value = service.name;
    option.textContent = `${service.name} · ${service.duration} min · ${service.price === 0 ? "besplatno" : `${service.price} €`}`;
    group.append(option);
  });

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Odaberi djelatnicu";
  placeholder.disabled = true;
  placeholder.selected = true;
  stylistSelect.append(placeholder);
  window.StudioflowDemo.staff.forEach((stylist) => {
    const option = document.createElement("option");
    option.value = stylist;
    option.textContent = stylist;
    stylistSelect.append(option);
  });

  scheduleDate.addEventListener("change", renderSchedule);
  document.querySelector("#schedule-previous-day").addEventListener("click", () => shiftDate(scheduleDate, -1, renderSchedule));
  document.querySelector("#schedule-next-day").addEventListener("click", () => shiftDate(scheduleDate, 1, renderSchedule));
  [bookingDate, serviceSelect, stylistSelect].forEach((control) => {
    control.addEventListener("change", updateAdminBookingTimes);
  });
  document.querySelector("#admin-booking-form").addEventListener("submit", saveAdminReservation);

  renderSchedule();
  updateAdminBookingTimes();
}

function shiftDate(input, offset, onChange) {
  const date = new Date(`${input.value}T12:00:00`);
  date.setDate(date.getDate() + offset);
  input.value = window.StudioflowDemo.dateKey(date);
  onChange();
}

function scheduleTimes() {
  return Array.from({ length: 120 }, (_, index) => {
    const total = 9 * 60 + index * 5;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  });
}

function renderSchedule() {
  const body = document.querySelector("#schedule-grid");
  if (!body) return;

  try {
    const reservations = window.StudioflowDemo.getReservations();
    const selectedDate = document.querySelector("#schedule-date").value;
    body.replaceChildren();
    scheduleTimes().forEach((time) => {
      const row = document.createElement("tr");
      const timeCell = document.createElement("th");
      timeCell.scope = "row";
      timeCell.textContent = time;
      row.append(timeCell);

      window.StudioflowDemo.staff.forEach((stylist) => {
        const cell = document.createElement("td");
        const state = window.StudioflowDemo.getStaffState(stylist, selectedDate, time, reservations);
        cell.className = `schedule-cell schedule-${state.type}`;
        cell.textContent = state.label;
        cell.setAttribute("aria-label", `${stylist}, ${time}: ${state.label}`);
        row.append(cell);
      });
      body.append(row);
    });
  } catch {
    body.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = window.StudioflowDemo.staff.length + 1;
    cell.className = "form-error";
    cell.textContent = "Nije moguće učitati raspored iz pohrane ovog preglednika.";
    row.append(cell);
    body.append(row);
  }
}

function updateAdminBookingTimes() {
  const form = document.querySelector("#admin-booking-form");
  if (!form) return;

  const service = window.StudioflowDemo.services.find((entry) => entry.name === form.elements.service.value);
  const date = form.elements.date.value;
  const stylist = form.elements.stylist.value;
  const timeSelect = form.elements.time;
  const previousTime = timeSelect.value;
  timeSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Odaberi slobodan termin";
  placeholder.disabled = true;
  placeholder.selected = true;
  timeSelect.append(placeholder);
  if (!service || !date || !stylist) return;

  const reservationData = {
    date,
    duration: service.duration,
    stylist,
  };
  let reservations;
  try {
    reservations = window.StudioflowDemo.getReservations();
  } catch {
    const error = document.querySelector("#admin-booking-error");
    error.textContent = "Nije moguće provjeriti slobodna vremena u pohrani ovog preglednika.";
    error.hidden = false;
    return;
  }
  const now = new Date();
  const today = window.StudioflowDemo.dateKey(now);
  for (let minute = 9 * 60; minute <= 18 * 60 + 30; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const candidate = { ...reservationData, time };
    const past = date === today && new Date(`${date}T${time}:00`) <= now;
    const closesTooLate = minute + service.duration + window.StudioflowDemo.cleanupMinutes > 19 * 60;
    if (past || closesTooLate || window.StudioflowDemo.hasConflict(candidate, reservations)) continue;

    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;
    option.selected = time === previousTime;
    timeSelect.append(option);
  }
}

function saveAdminReservation(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector("#admin-booking-error");
  const success = document.querySelector("#admin-booking-success");
  error.hidden = true;
  success.hidden = true;

  const formData = new FormData(form);
  const service = window.StudioflowDemo.services.find((entry) => entry.name === formData.get("service"));
  if (!service) {
    error.textContent = "Odaberi uslugu za rezervaciju.";
    error.hidden = false;
    return;
  }

  const reservation = {
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientName: String(formData.get("name")).trim(),
    clientEmail: String(formData.get("email")).trim().toLowerCase(),
    phone: String(formData.get("phone")).trim(),
    service: service.name,
    category: service.category,
    price: service.price,
    duration: service.duration,
    date: String(formData.get("date")),
    time: String(formData.get("time")),
    stylist: String(formData.get("stylist")),
    note: String(formData.get("note")).trim(),
    status: "booked",
    source: "admin",
    createdAt: new Date().toISOString(),
    cleanupMinutes: window.StudioflowDemo.cleanupMinutes,
    breakMinutes: window.StudioflowDemo.breakMinutes,
  };

  try {
    window.StudioflowDemo.saveReservation(reservation);
    form.elements.name.value = "";
    form.elements.email.value = "";
    form.elements.phone.value = "";
    form.elements.note.value = "";
    success.hidden = false;
  } catch (bookingError) {
    error.textContent = bookingError.message || "Nije moguće spremiti internu rezervaciju.";
    error.hidden = false;
  }
  renderReservations();
  renderSchedule();
  updateAdminBookingTimes();
}

function renderReservations() {
  const list = document.querySelector(requiredRole === "admin" ? "#admin-reservations" : "#user-reservations");
  if (!list) return;

  const emptyState = document.querySelector(requiredRole === "admin" ? "#admin-empty-state" : "#user-empty-state");
  try {
    const storedReservations = window.StudioflowDemo.getReservations();
    const reservations = requiredRole === "admin"
      ? storedReservations
      : storedReservations.filter((reservation) => reservation.clientEmail === account.email);
    reservations.sort((a, b) => dateTimeValue(a) - dateTimeValue(b));

    list.replaceChildren(...reservations.map((reservation) => createReservationCard(reservation, requiredRole === "admin")));
    emptyState.hidden = reservations.length > 0;

    if (requiredRole === "admin") {
      const today = window.StudioflowDemo.dateKey(new Date());
      const now = new Date();
      const active = reservations.filter((reservation) => reservation.status !== "cancelled");
      document.querySelector("#today-count").textContent = String(active.filter((reservation) => reservation.date === today).length);
      document.querySelector("#upcoming-count").textContent = String(active.filter((reservation) => dateTimeValue(reservation) >= now).length);
      document.querySelector("#admin-date-label").textContent = new Intl.DateTimeFormat("hr-HR", {
        day: "numeric",
        month: "long",
      }).format(now);
    }
  } catch {
    list.replaceChildren();
    emptyState.hidden = true;
    const error = document.createElement("p");
    error.className = "form-error";
    error.setAttribute("role", "alert");
    error.textContent = "Nije moguće učitati rezervacije iz pohrane ovog preglednika.";
    list.append(error);
  }
}

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    sessionStorage.removeItem("studioflow-demo-session");
    window.location.assign("prijava.html");
  });
});
