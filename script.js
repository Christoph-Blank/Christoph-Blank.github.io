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
  "Mama": "#FFB6C1",
  "Papa": "#87CEFA",
  "Kind1": "#FFD700",
  "Kind2": "#90EE90",
  "Familie": "#FFA500"
};

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  loadEvents().then(events => {

    // IDs nur lokal erzeugen (kein Speichern!)
    currentEvents = currentEvents.map(e => {
      if (!e.id) e.id = crypto.randomUUID();
      return e;
    });

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

      dateClick: function(info) {
        selectedDate = info.dateStr;
        selectedEvent = null;
        openCreateModal();
      },

      eventClick: function(info) {
        selectedEvent = info.event;
        openEditModal(info.event);
      },

      // Zeilenumbruch für lange Titel
      eventDidMount: function(info) {
        info.el.style.whiteSpace = "normal";
        info.el.style.wordBreak = "break-word";
      }
    });

    calendar.render();
  });

  document.getElementById("saveEventBtn")
    .addEventListener("click", saveEvent);

  document.getElementById("deleteEventBtn")
    .addEventListener("click", deleteEvent);

  // Checkbox-Logik Ganztag
  document.getElementById("modalAllDay")
    .addEventListener("change", function() {
      document.getElementById("modalTime").disabled = this.checked;
    });
});

// ---------------- MODAL ----------------

function openCreateModal() {
  selectedEvent = null;

  document.getElementById("modalHeadline").innerText = "Neuer Termin";
  document.getElementById("modalTitle").value = "";
  document.getElementById("modalTime").value = "";
  document.getElementById("modalPerson").value = "Mama";
  document.getElementById("modalAllDay").checked = false;
  document.getElementById("modalTime").disabled = false;

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

  if (event.allDay) {
    document.getElementById("modalAllDay").checked = true;
    document.getElementById("modalTime").value = "";
    document.getElementById("modalTime").disabled = true;
  } else {
    document.getElementById("modalAllDay").checked = false;
    document.getElementById("modalTime").disabled = false;
    document.getElementById("modalTime").value =
      event.startStr.split("T")[1].substring(0,5);
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
  const allDay = document.getElementById("modalAllDay").checked;

  if (!title || (!allDay && !time)) {
    alert("Bitte Beschreibung und Uhrzeit eingeben oder Ganztag aktivieren.");
    return;
  }

  let startValue;

  if (allDay) {
    startValue = selectedEvent
      ? selectedEvent.startStr.split("T")[0]
      : selectedDate;
  } else {
    const baseDate = selectedEvent
      ? selectedEvent.startStr.split("T")[0]
      : selectedDate;
    startValue = formatDateTime(baseDate, time);
  }

  const newTitle = title + " (" + person + ")";

  if (selectedEvent) {

    const index = currentEvents.findIndex(e => e.id === selectedEvent.id);

    currentEvents[index] = {
      id: selectedEvent.id,
      title: newTitle,
      start: startValue,
      allDay: allDay,
      backgroundColor: categories[person],
      borderColor: categories[person]
    };

    selectedEvent.setProp("title", newTitle);
    selectedEvent.setStart(startValue);
    selectedEvent.setAllDay(allDay);
    selectedEvent.setProp("backgroundColor", categories[person]);
    selectedEvent.setProp("borderColor", categories[person]);

  } else {

    const newEvent = {
      id: crypto.randomUUID(),
      title: newTitle,
      start: startValue,
      allDay: allDay,
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
  selectedEvent.remove();

  currentEvents = currentEvents.filter(e => e.id !== eventId);

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

    const startObj = new Date(event.start);
    const endObj = new Date(startObj);
    endObj.setHours(endObj.getHours() + 1);

    ics += "BEGIN:VEVENT\n";
    ics += "X-GWITEM-TYPE:APPOINTMENT\n";
    ics += "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z\n";
    ics += "SUMMARY:" + event.title + "\n";
    ics += "TRANSP:TRANSPARENT\n";
    ics += "X-GWSHOW-AS:FREE\n";
    ics += "X-MICROSOFT-CDO-INTENDEDSTATUS:FREE\n";
    ics += "DESCRIPTION:" + event.title + "\n";

    if (event.allDay) {
      const dateOnly = event.start.replace(/-/g, "");
      ics += "DTSTART;VALUE=DATE:" + dateOnly + "\n";
      ics += "DTEND;VALUE=DATE:" + dateOnly + "\n";
      ics += "X-GWALLDAYEVENT:TRUE\n";
    } else {
      const dtStart = startObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const dtEnd = endObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      ics += "DTSTART:" + dtStart + "\n";
      ics += "DTEND:" + dtEnd + "\n";
    }

    ics += "UID:" + event.id + "@familienkalender\n";
    ics += "PRIORITY:5\n";
    ics += "CLASS:PUBLIC\n";
    ics += "X-GWCLASS:NORMAL\n";
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";

  let blob = new Blob([ics], { type: 'text/calendar' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familienkalender.ics";
  link.click();
}
