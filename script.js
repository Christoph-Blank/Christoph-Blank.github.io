const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "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";
const filePath = "events.json";

let currentEvents = [];
let selectedDate = null;
let selectedEvent = null;
let calendar;

document.addEventListener('DOMContentLoaded', function () {

  const calendarEl = document.getElementById('calendar');
  const createBtn = document.getElementById("createEventBtn");

  loadEvents().then(events => {

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: false,
      events: events,

      dateClick: function(info) {
        selectedDate = info.dateStr;
        openCreateModal();
      },

      eventClick: function(info) {
        openEditModal(info.event);
      }
    });

    calendar.render();
  });

  createBtn.addEventListener("click", function() {
    if (selectedDate) {
      openCreateModal();
    }
  });

  document.getElementById("saveEventBtn")
    .addEventListener("click", saveEvent);

  document.getElementById("deleteEventBtn")
    .addEventListener("click", deleteEvent);
});


// ---------------- MODAL STEUERUNG ----------------

function openCreateModal() {

  selectedEvent = null;

  document.getElementById("modalHeadline").innerText = "Neuer Termin";
  document.getElementById("modalTitle").value = "";
  document.getElementById("modalTime").value = "";
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
    // 🔵 BEARBEITEN

    const newDateTime = selectedEvent.startStr.split("T")[0] + "T" + time;
    const newTitle = title + " (" + person + ")";

    const oldTitle = selectedEvent.title;
    const oldStart = selectedEvent.startStr;

    selectedEvent.setProp("title", newTitle);
    selectedEvent.setStart(newDateTime);

    const index = currentEvents.findIndex(e =>
      e.title === oldTitle && e.start === oldStart
    );

    if (index !== -1) {
      currentEvents[index] = {
        title: newTitle,
        start: newDateTime
      };
    }

  } else {
    // 🟢 NEUER TERMIN

    const dateTime = selectedDate + "T" + time;
    const newEvent = {
      title: title + " (" + person + ")",
      start: dateTime
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

  const title = selectedEvent.title;
  const start = selectedEvent.startStr;

  selectedEvent.remove();

  currentEvents = currentEvents.filter(e =>
    !(e.title === title && e.start === start)
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


// ---------------- EXPORT ----------------

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

