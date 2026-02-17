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

