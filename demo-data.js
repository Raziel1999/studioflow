(() => {
  const reservationKey = "studioflow-demo-reservations";
  const sessionKey = "studioflow-demo-session";
  const staff = ["Mia", "Lana", "Ana"];
  const cleanupMinutes = 5;
  const breakMinutes = 8;
  const services = [
    ["Ženske frizure", "Žensko šišanje — kratka kosa", 28, 45],
    ["Ženske frizure", "Žensko šišanje — srednja kosa", 34, 55],
    ["Ženske frizure", "Žensko šišanje — duga kosa", 40, 65],
    ["Ženske frizure", "Feniranje", 25, 40],
    ["Ženske frizure", "Bojanje izrasta", 45, 90],
    ["Ženske frizure", "Bojanje cijele dužine", 70, 120],
    ["Ženske frizure", "Pramenovi", 100, 150],
    ["Ženske frizure", "Balayage i toniranje", 120, 180],
    ["Ženske frizure", "Dubinska njega i obnova kose", 25, 40],
    ["Muške frizure", "Muško šišanje", 22, 30],
    ["Muške frizure", "Fade šišanje", 25, 40],
    ["Muške frizure", "Šišanje mašinicom", 16, 20],
    ["Muške frizure", "Oblikovanje brade", 14, 20],
    ["Muške frizure", "Šišanje i oblikovanje brade", 32, 50],
    ["Kozmetički tretmani", "Osnovno čišćenje lica", 48, 60],
    ["Kozmetički tretmani", "Hidratantna njega lica", 58, 60],
    ["Kozmetički tretmani", "Anti-age njega lica", 72, 75],
    ["Kozmetički tretmani", "Oblikovanje i bojanje obrva", 23, 30],
    ["Kozmetički tretmani", "Lash lift i bojanje", 45, 60],
    ["Konzultacije", "Konzultacije", 0, 20],
  ].map(([category, name, price, duration]) => ({ category, name, price, duration }));

  function readReservations() {
    const stored = localStorage.getItem(reservationKey);
    if (!stored) return [];

    const reservations = JSON.parse(stored);
    if (!Array.isArray(reservations)) {
      throw new Error("Pohranjeni podaci rezervacija nisu valjani.");
    }
    return reservations;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function minutes(time) {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  }

  function reservationInterval(reservation) {
    const start = minutes(reservation.time);
    const duration = Number(reservation.duration || 0);
    const cleanup = Number(reservation.cleanupMinutes ?? cleanupMinutes);
    const rest = Number(reservation.breakMinutes ?? breakMinutes);
    return {
      start,
      serviceEnd: start + duration,
      cleanupEnd: start + duration + cleanup,
      availableAt: start + duration + cleanup + rest,
    };
  }

  function overlaps(first, second) {
    return first.start < second.availableAt && second.start < first.availableAt;
  }

  window.StudioflowDemo = {
    staff,
    services,
    cleanupMinutes,
    breakMinutes,
    getSession() {
      const stored = sessionStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : null;
    },
    getReservations: readReservations,
    saveReservation(reservation) {
      const reservations = readReservations();
      if (this.hasConflict(reservation, reservations)) {
        throw new Error(`Odabrani termin ili potreban odmor za djelatnicu ${reservation.stylist} preklapa se s drugim terminom.`);
      }
      reservations.push(reservation);
      localStorage.setItem(reservationKey, JSON.stringify(reservations));
    },
    hasConflict(reservation, reservations = readReservations()) {
      const candidateInterval = reservationInterval(reservation);
      return reservations.some((existing) => {
        if (existing.date !== reservation.date || existing.status === "cancelled") return false;
        if (
          reservation.stylist !== "Bilo tko iz tima"
          && existing.stylist !== "Bilo tko iz tima"
          && existing.stylist !== reservation.stylist
        ) return false;
        return overlaps(candidateInterval, reservationInterval(existing));
      });
    },
    findAvailableStylist(reservation, reservations = readReservations()) {
      return staff.find((stylist) => !this.hasConflict({ ...reservation, stylist }, reservations)) || null;
    },
    getStaffState(stylist, date, time, reservations = readReservations()) {
      const slotStart = minutes(time);
      const matches = reservations.filter((reservation) =>
        reservation.date === date
        && reservation.status !== "cancelled"
        && (reservation.stylist === stylist || reservation.stylist === "Bilo tko iz tima")
        && slotStart >= reservationInterval(reservation).start
        && slotStart < reservationInterval(reservation).availableAt
      );
      if (!matches.length) return { type: "available", label: "Slobodno" };

      const reservation = matches[0];
      const interval = reservationInterval(reservation);
      if (slotStart < interval.serviceEnd) {
        return {
          type: "booked",
          label: slotStart === interval.start
            ? `${reservation.time} · ${reservation.service} · ${reservation.clientName}`
            : "Zauzeto",
        };
      }
      if (slotStart < interval.cleanupEnd) return { type: "cleanup", label: "Pospremanje" };
      return { type: "break", label: "Odmor" };
    },
    getDateKey: dateKey,
    dateKey,
  };
})();
