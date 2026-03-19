class CalendarApp {
  constructor() {
    this.today = new Date();
    this.viewDate = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      1,
    );
    this.selectedDate = new Date(this.today);

    this.weekdaysDE = [
      "Sonntag",
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
    ];
    this.monthsDE = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];

    this.fixedHolidays = [
      { m: 1, d: 1 }, // Neujahr
      { m: 5, d: 1 }, // Tag der Arbeit
      { m: 10, d: 3 }, // Tag der Deutschen Einheit
      { m: 12, d: 25 }, // 1. Weihnachtstag
      { m: 12, d: 26 }, // 2. Weihnachtstag
    ];

    this.init();
  }

  init() {
    this.setupTheme();
    this.attachEventListeners();
    this.refreshUI();
  }

  refreshUI() {
    this.updateStaticInfo(this.selectedDate);
    this.renderCalendar();
    this.fetchHistoricalEvents(this.selectedDate);
  }

  setupTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }

  attachEventListeners() {
    document
      .getElementById("theme-toggle")
      .addEventListener("click", () => this.toggleTheme());
    document
      .getElementById("btn-prev")
      .addEventListener("click", () => this.changeMonth(-1));
    document
      .getElementById("btn-next")
      .addEventListener("click", () => this.changeMonth(1));

    document.getElementById("calendar-body").addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "TD" && target.textContent !== "") {
        this.selectDate(parseInt(target.textContent));
      }
    });
  }

  selectDate(day) {
    this.selectedDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth(),
      day,
    );
    this.refreshUI();
  }

  changeMonth(offset) {
    this.viewDate.setMonth(this.viewDate.getMonth() + offset);
    this.renderCalendar();
  }

  easterSunday(year) {
    const a = year % 19,
      b = Math.floor(year / 100),
      c = year % 100,
      d = Math.floor(b / 4),
      e = b % 4,
      f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4),
      k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  }

  isNationwidePublicHoliday(dateObj) {
    const year = dateObj.getFullYear();
    const mm = dateObj.getMonth() + 1;
    const dd = dateObj.getDate();
    const easter = this.easterSunday(year);

    const getMovable = (offset) =>
      new Date(year, easter.getMonth(), easter.getDate() + offset);
    const movableDates = [
      getMovable(-2), // Karfreitag
      getMovable(1), // Ostermontag
      getMovable(39), // Christi Himmelfahrt
      getMovable(50), // Pfingstmontag
    ];

    const holidays = [
      ...this.fixedHolidays,
      ...movableDates.map((d) => ({ m: d.getMonth() + 1, d: d.getDate() })),
    ];

    return holidays.some((h) => h.m === mm && h.d === dd);
  }

  getDayOfYear(dateObj) {
    const start = new Date(dateObj.getFullYear(), 0, 0);
    const diff = dateObj - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  updateStaticInfo(targetDate) {
    const date = targetDate.getDate();
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();
    const weekday = this.weekdaysDE[targetDate.getDay()];

    const isToday = targetDate.toDateString() === this.today.toDateString();
    const prefix = isToday ? "Heute ist" : "Der gewählte Tag ist ein";

    document.getElementById("selected-date-display").textContent =
      `${date}. ${this.monthsDE[month]} ${year}`;

    const dayOfYear = this.getDayOfYear(targetDate);
    const totalDays =
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
    const daysLeft = totalDays - dayOfYear;

    const p1 = `${prefix} ${weekday}, der ${date}. ${this.monthsDE[month]} ${year}.`;
    const p2 = `Es handelt sich um den ${dayOfYear}. Tag des Jahres. Bis zum Jahresende sind es noch ${daysLeft} Tage.`;
    this.updateEl("info-paragraph", `${p1} ${p2}`);

    const isHoliday = this.isNationwidePublicHoliday(targetDate);
    this.updateEl(
      "holiday-paragraph",
      isHoliday
        ? "🎉 Dieser Tag ist ein gesetzlicher Feiertag in Deutschland."
        : "An diesem Tag ist kein bundesweiter gesetzlicher Feiertag.",
    );
  }

  renderCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    this.updateEl("calendar-month-year", `${this.monthsDE[month]} ${year}`);

    const tableBody = document.getElementById("calendar-body");
    tableBody.innerHTML = "";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayJS = new Date(year, month, 1).getDay();
    const firstCol = (firstDayJS + 6) % 7;

    let row = document.createElement("tr");

    for (let i = 0; i < firstCol; i++) {
      row.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const colIndex = (firstCol + (day - 1)) % 7;
      const td = document.createElement("td");
      td.textContent = day;

      // if (
      //   day === this.today.getDate() &&
      //   month === this.today.getMonth() &&
      //   year === this.today.getFullYear()
      // ) {
      //   td.classList.add("today");
      // }

      if (
        day === this.selectedDate.getDate() &&
        month === this.selectedDate.getMonth() &&
        year === this.selectedDate.getFullYear()
      ) {
        td.classList.add("selected");
        td.setAttribute("aria-selected", "true");
      }

      row.appendChild(td);

      if (colIndex === 6 || day === daysInMonth) {
        while (row.children.length < 7) {
          row.appendChild(document.createElement("td"));
        }
        tableBody.appendChild(row);
        row = document.createElement("tr");
      }
    }
  }

  async fetchHistoricalEvents(targetDate) {
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");

    this.updateEl(
      "history-heading",
      `Historische Ereignisse am ${targetDate.getDate()}. ${this.monthsDE[targetDate.getMonth()]}`,
    );

    const loader = document.getElementById("history-loading");
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    loader.classList.remove("hidden");

    try {
      const response = await fetch(
        `https://de.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`,
      );
      if (!response.ok) throw new Error("API Offline");

      const data = await response.json();
      loader.classList.add("hidden");

      const events = data.events.slice(0, 5);
      if (events.length === 0) {
        list.innerHTML = "<li>Keine Ereignisse für dieses Datum gefunden.</li>";
        return;
      }

      events.forEach((event) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${event.year}:</strong> ${event.text}`;
        list.appendChild(li);
      });
    } catch (error) {
      console.error("Fetch error:", error);
      loader.textContent = "Fehler beim Laden der historischen Ereignisse.";
    }
  }

  updateEl(id, content) {
    const el = document.getElementById(id);
    if (el) el.textContent = content;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CalendarApp();
});
