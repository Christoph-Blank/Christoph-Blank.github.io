const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "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";
const filePath = "events.json";

let currentEvents = [];
let selectedDate = null;
let selectedEvent = null;
let calendar;

// Kategorie-Farben
const categories = {
  "Mama": "#FFB6C1",    // rosa
  "Papa": "#87CEFA",    // blau
  "Kind_O": "#FFD700",   // gold
  "Kind_I": "#90EE90",   // grün
  "Familie": "#FFA500"  // orange
};

document.addEventListener('DOMContentLoaded', function () {

  const calendarEl = document.getElementById('calendar');
  const createBtn = document.getElementById("createEventBtn");

  loadEvents().then(events => {

    // Fallback: jeder Termin bekommt eine ID
    currentEvents = currentEvents.map(e => {
      if (!e.id) e.id = crypto.randomUUID();
      return e;
    });
    saveEvents(currentEvents);

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'de',        // Kalender auf Deutsch
      firstDay: 1,         // Wochenstart Montag
      selectable: false,
      events: currentEvents,
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false, meridiem: false },

      // Mobile Tap
      dateClick: function(info) {
        selectedDate = info.dateStr;
        selectedEvent = null;
        openCreateModal();
      },

      // EventClick für Bearbeiten
      eventClick: function(info) {
        selectedEvent = info.event;
        openEditModal(info.event);
      },

      eventContent: function(arg) {
          let date = arg.event.start;
          if (date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return { html: `<b>${hours}:${minutes} Uhr</b> ${arg.event.title}` };
          } else {
            return { html: arg.event.title };
          }
        }
      }
    });

    calendar.render();
  });

  createBtn.addEventListener("click", function() {
    if (selectedDate) openCreateModal();
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
    const newDateTime = selectedEvent.startStr.split("T")[0] + "T" + time;
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
    const dateTime = selectedDate + "T" + time;
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


