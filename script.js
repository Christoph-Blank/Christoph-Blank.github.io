const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "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";
const filePath = "events.json";

let currentEvents = [];
let selectedDate = null;
let calendar;

document.addEventListener('DOMContentLoaded', function () {

  const calendarEl = document.getElementById('calendar');
  const createBtn = document.getElementById("createEventBtn");

  loadEvents().then(events => {

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      events: events,

      select: function(info) {
        selectedDate = info.startStr;
        createBtn.disabled = false;
      },

      eventClick: function(info) {

        const action = prompt(
          "1 = Bearbeiten\n2 = Löschen"
        );

        if (action === "2") {
          if (confirm("Termin löschen?")) {

            const title = info.event.title;
            const start = info.event.startStr;

            info.event.remove();

            currentEvents = currentEvents.filter(e =>
              !(e.title === title && e.start === start)
            );

            saveEvents(currentEvents);
          }
        }
      }
    });

    calendar.render();
  });

  createBtn.addEventListener("click", function() {
    if (selectedDate) {
      openModal();
    }
  });

  document.getElementById("saveEventBtn")
    .addEventListener("click", saveNewEvent);
});


function openModal() {
  document.getElementById("eventModal").style.display = "block";
}

function closeModal() {
  document.getElementById("eventModal").style.display = "none";
}

function saveNewEvent() {

  const person = document.getElementById("modalPerson").value;
  const title = document.getElementById("modalTitle").value;
  const time = document.getElementById("modalTime").value;

  if (!title || !time) {
    alert("Bitte Titel und Uhrzeit eingeben");
    return;
  }

  const dateTime = selectedDate + "T" + time;

  const newEvent = {
    title: title + " (" + person + ")",
    start: dateTime
  };

  currentEvents.push(newEvent);
  calendar.addEvent(newEvent);
  saveEvents(currentEvents);

  closeModal();
  document.getElementById("modalTitle").value = "";
  document.getElementById("modalTime").value = "";
}


async function loadEvents() {

  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      headers: { Authorization: "token " + token }
    }
  );

  const data = await response.json();
  const content = atob(data.content);
  currentEvents = JSON.parse(content);

  return currentEvents;
}


async function saveEvents(events) {

  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      headers: { Authorization: "token " + token }
    }
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

