const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "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";
const filePath = "events.json";

let currentEvents = [];

document.addEventListener('DOMContentLoaded', function () {

  const calendarEl = document.getElementById('calendar');

  loadEvents().then(events => {

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      events: events,

      // ➕ Termin hinzufügen
      select: function(info) {

        let title = prompt("Termin Titel:");
        let person = document.getElementById("personSelect").value;

        if (title) {

          const newEvent = {
            title: title + " (" + person + ")",
            start: info.startStr
          };

          currentEvents.push(newEvent);
          calendar.addEvent(newEvent);
          saveEvents(currentEvents);
        }
      },

      // ✏🗑 Termin anklicken (Bearbeiten oder Löschen)
      eventClick: function(info) {

        const action = prompt(
          "Tippe:\n1 = Bearbeiten\n2 = Löschen"
        );

        // 🗑 Löschen
        if (action === "2") {

          if (confirm("Termin wirklich löschen?")) {

            const eventTitle = info.event.title;
            const eventStart = info.event.startStr;

            info.event.remove();

            currentEvents = currentEvents.filter(e =>
              !(e.title === eventTitle &&
                e.start === eventStart)
            );

            saveEvents(currentEvents);
          }
        }

        // ✏ Bearbeiten
        if (action === "1") {

          const oldTitle = info.event.title;
          const eventStart = info.event.startStr;

          const newTitle = prompt("Neuer Titel:", oldTitle);

          if (newTitle) {

            info.event.setProp("title", newTitle);

            const eventIndex = currentEvents.findIndex(e =>
              e.title === oldTitle &&
              e.start === eventStart
            );

            if (eventIndex !== -1) {
              currentEvents[eventIndex].title = newTitle;
              saveEvents(currentEvents);
            }
          }
        }
      }

    });

    calendar.render();
  });
});


// 📥 Termine von GitHub laden
async function loadEvents() {

  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      headers: {
        Authorization: "token " + token
      }
    }
  );

  const data = await response.json();

  if (!data.content) {
    console.error("Fehler beim Laden der events.json");
    return [];
  }

  const content = atob(data.content);
  currentEvents = JSON.parse(content);

  return currentEvents;
}


// 💾 Termine speichern (inkl. SHA Aktualisierung)
async function saveEvents(events) {

  // Aktuelle SHA holen
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      headers: {
        Authorization: "token " + token
      }
    }
  );

  const data = await response.json();
  const currentSha = data.sha;

  const content = btoa(JSON.stringify(events, null, 2));

  const updateResponse = await fetch(
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

  const updateData = await updateResponse.json();

  if (updateData.content && updateData.content.sha) {
    console.log("Gespeichert ✔");
  } else {
    console.error("Speichern fehlgeschlagen", updateData);
  }
}


// 📤 ICS Export
function exportICS() {

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";

  currentEvents.forEach(event => {
    ics += "BEGIN:VEVENT\n";
    ics += "SUMMARY:" + event.title + "\n";
    ics += "DTSTART:" + event.start.replace(/-/g, "") + "\n";
    ics += "DTEND:" + event.start.replace(/-/g, "") + "\n";
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";

  let blob = new Blob([ics], { type: 'text/calendar' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familienkalender.ics";
  link.click();
}


