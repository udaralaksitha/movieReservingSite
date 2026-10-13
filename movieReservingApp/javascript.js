const movies = {
  stellar: {
    title: "Stellar Drift",
    price: 1200,
  },
  midnight: {
    title: "Midnight Run",
    price: 1100,
  },
  wild: {
    title: "Wild Horizon",
    price: 1000,
  },
  laugh: {
    title: "Laugh Track",
    price: 950,
  },
};

const occupiedSeats = new Set([
  "A3",
  "A4",
  "B7",
  "C2",
  "C8",
  "D4",
  "E5",
  "F1",
  "F8",
]);

const state = {
  movie: "stellar",
  date: "",
  time: "3:45 PM",
  seats: new Set(),
};

const dateOptions = document.getElementById("date-options");
const seatMap = document.getElementById("seat-map");
const bookingMessage = document.getElementById("booking-message");
const bookingList = document.getElementById("booking-list");

// Format a date as YYYY-MM-DD using local time.
function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Display the next five selectable dates.
function renderDates() {
  dateOptions.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + i);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-option";
    button.dataset.date = dateKey(date);

    const dayName =
      i === 0
        ? "TODAY"
        : date
            .toLocaleDateString("en", {
              weekday: "short",
            })
            .toUpperCase();

    const dayNumber = date.getDate();

    const monthName = date
      .toLocaleDateString("en", {
        month: "short",
      })
      .toUpperCase();

    button.innerHTML = `
      <span class="day">${dayName}</span>
      <span class="date-number">${dayNumber}</span>
      <span class="month">${monthName}</span>
    `;

    button.addEventListener("click", () => {
      state.date = button.dataset.date;

      document.querySelectorAll(".date-option").forEach((option) => {
        option.classList.toggle("active", option === button);
      });

      bookingMessage.textContent = "";
      updateSummary();
    });

    dateOptions.appendChild(button);
  }

  const firstDate = dateOptions.querySelector(".date-option");

  if (firstDate) {
    firstDate.classList.add("active");
    state.date = firstDate.dataset.date;
  }
}

// Create the cinema seat map.
function renderSeats() {
  seatMap.innerHTML = "";

  const rows = ["A", "B", "C", "D", "E", "F"];

  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "seat-row";

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = row;

    rowElement.appendChild(label);

    for (let number = 1; number <= 8; number++) {
      const seatId = `${row}${number}`;

      const seat = document.createElement("button");
      seat.type = "button";
      seat.className = "seat";
      seat.title = `Seat ${seatId}`;
      seat.setAttribute("aria-label", `Seat ${seatId}`);

      if (occupiedSeats.has(seatId)) {
        seat.disabled = true;
        seat.setAttribute("aria-label", `Seat ${seatId}, unavailable`);
      } else {
        seat.classList.toggle("selected", state.seats.has(seatId));

        seat.setAttribute("aria-pressed", String(state.seats.has(seatId)));

        seat.addEventListener("click", () => {
          if (state.seats.has(seatId)) {
            state.seats.delete(seatId);
          } else {
            state.seats.add(seatId);
          }

          bookingMessage.textContent = "";

          renderSeats();
          updateSummary();
        });
      }

      if (number === 5) {
        seat.classList.add("seat-gap");
      }

      rowElement.appendChild(seat);
    }

    seatMap.appendChild(rowElement);
  });
}

// Format dates for the booking summary.
function formatDate(value) {
  if (!value) {
    return "Choose a date";
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day, 12).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format the ticket price.
function money(amount) {
  return "LKR " + amount.toLocaleString("en");
}

// Update the reservation summary.
function updateSummary() {
  const movie = movies[state.movie];

  document.getElementById("summary-movie").textContent = movie.title;

  document.getElementById("summary-date").textContent = formatDate(state.date);

  document.getElementById("summary-time").textContent = state.time;

  const selectedSeats = [...state.seats].sort();

  document.getElementById("summary-seats").textContent = selectedSeats.length
    ? selectedSeats.join(", ")
    : "None selected";

  document.getElementById("summary-count").textContent = selectedSeats.length;

  document.getElementById("summary-total").textContent = money(
    selectedSeats.length * movie.price,
  );
}

// Change the selected movie.
document.querySelectorAll(".movie-card").forEach((card) => {
  card.addEventListener("click", () => {
    state.movie = card.dataset.movie;
    state.seats.clear();

    document.querySelectorAll(".movie-card").forEach((item) => {
      const selected = item === card;

      item.classList.toggle("selected", selected);

      item.querySelector(".select-label").textContent = selected
        ? "Selected ✓"
        : "Select movie";
    });

    bookingMessage.textContent = "";

    renderSeats();
    updateSummary();
  });
});

// Change the selected showtime.
document.querySelectorAll(".time-options button").forEach((button) => {
  button.addEventListener("click", () => {
    state.time = button.dataset.time;

    document.querySelectorAll(".time-options button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    bookingMessage.textContent = "";
    updateSummary();
  });
});

// Read saved bookings from this browser.
function getBookings() {
  try {
    return JSON.parse(localStorage.getItem("cinebook-bookings") || "[]");
  } catch (error) {
    console.error("Could not load bookings:", error);
    return [];
  }
}

// Save bookings in this browser.
function saveBookings(bookings) {
  try {
    localStorage.setItem("cinebook-bookings", JSON.stringify(bookings));

    return true;
  } catch (error) {
    console.error("Could not save bookings:", error);
    bookingMessage.textContent = "Could not save your booking in this browser.";

    return false;
  }
}

// Show saved reservations on the page.
function renderBookings() {
  const bookings = getBookings();

  bookingList.innerHTML = "";

  if (bookings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your reservations will appear here.";

    bookingList.appendChild(empty);
    return;
  }

  bookings
    .slice()
    .reverse()
    .forEach((booking) => {
      const item = document.createElement("article");
      item.className = "booking-item";

      const details = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = booking.movie;

      const info = document.createElement("p");
      info.textContent =
        `${formatDate(booking.date)} · ${booking.time} · ` +
        `Seats ${booking.seats.join(", ")} · ` +
        money(booking.total);

      details.appendChild(title);
      details.appendChild(info);

      const code = document.createElement("span");
      code.className = "booking-code";
      code.textContent = `CONFIRMED · ${booking.code}`;

      item.appendChild(details);
      item.appendChild(code);

      bookingList.appendChild(item);
    });
}

// Confirm the reservation.
document.getElementById("confirm-booking").addEventListener("click", () => {
  if (!state.date) {
    bookingMessage.textContent = "Please choose a date.";
    return;
  }

  if (state.seats.size === 0) {
    bookingMessage.textContent = "Please select at least one seat.";

    seatMap.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return;
  }

  const movie = movies[state.movie];
  const seats = [...state.seats].sort();

  const booking = {
    code: "CB" + Date.now().toString().slice(-6),
    movie: movie.title,
    date: state.date,
    time: state.time,
    seats: seats,
    total: seats.length * movie.price,
    createdAt: new Date().toISOString(),
  };

  const bookings = getBookings();
  bookings.push(booking);

  if (!saveBookings(bookings)) {
    return;
  }

  // Mark the selected seats unavailable for this page session.
  state.seats.forEach((seat) => occupiedSeats.add(seat));
  state.seats.clear();

  renderSeats();
  updateSummary();
  renderBookings();

  bookingMessage.textContent = `Reservation confirmed! Your code is ${booking.code}.`;

  document.getElementById("my-bookings").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

// Clear saved booking history.
document.getElementById("clear-bookings").addEventListener("click", () => {
  if (getBookings().length === 0) {
    bookingMessage.textContent = "There is no booking history to clear.";
    return;
  }

  if (confirm("Clear all saved demo reservations?")) {
    if (saveBookings([])) {
      renderBookings();
      bookingMessage.textContent = "Booking history cleared.";
    }
  }
});

// Display the current year.
document.getElementById("year").textContent = new Date().getFullYear();

// Initialize the page.
renderDates();
renderSeats();
updateSummary();
renderBookings();
