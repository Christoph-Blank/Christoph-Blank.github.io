const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "DEIN_TOKEN";
const filePath = "events.json";

let currentEvents = [];
let selectedDate = null;
let selectedEvent = null;
let calendar;

// Kategorie-Farben
const categories = {
  "Mama": "#FFB6C1",
  "Papa": "#87CEFA",
  "Kind1": "#FFD700",
  "Kind2": "#90EE90",
  "Familie": "#FFA500"
};

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const createBtn = document.getElementById("createEventBtn");

  loadEvents().then(events => {

    // Jeder Termin bekommt eine ID
    currentEvents = currentEvents.map(e => {
      if (!e.id) e.id = crypto.randomUUID();
      return e;
    });
    saveEvents(currentEvents);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'de',
      firstDay: 1,
      selectable: false,
      events: currentEvents,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      eventClick: function(info) {
        selectedEvent = info.event;
        openEditModal(info.event);
      }
    });

    // Nur Desktop: dateClick aktivieren
    if (!isMobile) {
      calendar.setOption('dateClick', function(info) {
        selectedDate = info.dateStr;
        selectedEvent = null;
        openCreateModal();
      });
    }

    calendar.render();
  });

  // Button für neuen Termin (immer aktiv)
  createBtn.addEventListener("click", function() {
    if (selectedDate || isMobile) {
      // Desktop: selectedDate wird beim Klick auf eine Zelle gesetzt
      // Mobile: wir setzen heute als default
      if (!selectedDate) selectedDate = new Date().toISOString().split("T")[0];
      openCreateModal();
    }
  });

  document.getElementById("saveEventBtn")
    .addEventListener("click", saveEvent);

  document.getElementById("deleteEventBtn")
    .addEventListener("click", deleteEvent);
});

// ---------------- MODAL ----------------

function openCreateModal() {
  selectedEvent = null;
  document.getElementById("modalHeadline").innerText = "Neuer Termin";
  document.getElementById("modalTitle").value = "";
  document.getElementById("modalTime").value = "";
  document.getElementById("modalPerson").value = "Mama";
  document.getElementById("deleteEventBtn").style.display = "none";
  document.getElementById("eventModal").style.display = "block";
}

function openEditModal(event) {
  selectedEvent = event;
  document.getElementById("modalHeadline").innerText = "Termin bearbeiten";

  const [titlePart, personPart] = event.title.split(" (");
  const person = personPart ? personPart.replace(")", "") : "";

  document.getElementById("modalTitle").value = titlePart;
  document.getElementById("modalPerson").value = person;

  if (event.startStr.includes("T")) {
    document.getElementById("modalTime").value =
      event.startStr.split("T")[1].substring(0,5);
  } else {
    document.getElementById("modalTime").value = "12:00";
  }

  document.getElementById("deleteEventBtn").style.display = "inline-block";
  document.getElementById("eventModal").style.display = "block";
}

function closeModal() {
  document.getElementById("eventModal").style.display = "none";
}

// ---------------- HELPER ----------------

function formatDateTime(dateStr, timeStr) {
  return dateStr + "T" + timeStr;
}

// ---------------- SPEICHERN ----------------

function saveEvent() {
  const person = document.getElementById("modalPerson").value;
  const title = document.getElementById("modalTitle").value;
  const time = document.getElementById("modalTime").value;

  if (!title || !time) {
    alert("Bitte Titel und Uhrzeit eingeben");
    return;
  }

  if (selectedEvent) {
    // Bearbeiten
    const newDateTime = formatDateTime(selectedEvent.startStr.split("T")[0], time);
    const newTitle = title + " (" + person + ")";
    const index = currentEvents.findIndex(e => e.id === selectedEvent.id);

    if (index !== -1) {
      currentEvents[index] = {
        id: currentEvents[index].id,
        title: newTitle,
        start: newDateTime,
        backgroundColor: categories[person],
        borderColor: categories[person]
      };
    }

    selectedEvent.setProp("title", newTitle);
    selectedEvent.setStart(newDateTime);
    selectedEvent.setProp("backgroundColor", categories[person]);
    selectedEvent.setProp("borderColor", categories[person]);

  } else {
    // Neuer Termin
    const dateTime = formatDateTime(selectedDate, time);
    const newEvent = {
      id: crypto.randomUUID(),
      title: title + " (" + person + ")",
      start: dateTime,
      backgroundColor: categories[person],
      borderColor: categories[person]
    };

    currentEvents.push(newEvent);
    calendar.addEvent(newEvent);
  }

  saveEvents(currentEvents);
  closeModal();
}

// ---------------- LÖSCHEN ----------------

function deleteEvent() {
  if (!selectedEvent) return;
  if (!confirm("Termin wirklich löschen?")) return;

  const eventId = selectedEvent.id;
  const eventTitle = selectedEvent.title;
  const eventStart = selectedEvent.startStr;

  selectedEvent.remove();

  currentEvents = currentEvents.filter(e => 
    e.id ? e.id !== eventId : !(e.title === eventTitle && e.start === eventStart)
  );

  saveEvents(currentEvents);
  closeModal();
}

// ---------------- GITHUB ----------------

async function loadEvents() {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    { headers: { Authorization: "token " + token } }
  );

  const data = await response.json();
  const content = atob(data.content);
  currentEvents = JSON.parse(content);

  return currentEvents;
}

async function saveEvents(events) {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    { headers: { Authorization: "token " + token } }
  );

  const data = await response.json();
  const currentSha = data.sha;

  const content = btoa(JSON.stringify(events, null, 2));

  await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: "token " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update events",
        content: content,
        sha: currentSha
      })
    }
  );
}

// ---------------- ICS EXPORT ----------------

function exportICS() {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";

  currentEvents.forEach(event => {
    ics += "BEGIN:VEVENT\n";
    ics += "SUMMARY:" + event.title + "\n";
    ics += "DTSTART:" + event.start.replace(/[-:]/g, "") + "\n";
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";

  let blob = new Blob([ics], { type: 'text/calendar' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familienkalender.ics";
  link.click();
}
