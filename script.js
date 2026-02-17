const username = "Christoph-Blank";
const repo = "Christoph-Blank.github.io";
const token = "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";
const filePath = "events.json";

let sha = "";
let currentEvents = [];

document.addEventListener('DOMContentLoaded', function () {

  const calendarEl = document.getElementById('calendar');

  loadEvents().then(events => {

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      events: events,

      select: function(info) {

        let title = prompt("Termin Titel:");
        let person = document.getElementById("personSelect").value;

        if (title) {

          const newEvent = {
            title: title + " (" + person + ")",
            start: info.startStr
          };

          currentEvents.push(newEvent);
          saveEvents(currentEvents);
          calendar.addEvent(newEvent);
        }
      }
    });

    calendar.render();
  });
});

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
  sha = data.sha;

  const content = atob(data.content);
  currentEvents = JSON.parse(content);

  return currentEvents;
}

async function saveEvents(events) {

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
  sha = updateData.content.sha;
}


function exportICS() {

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";

  currentEvents.forEach(event => {
    ics += "BEGIN:VEVENT\n";
    ics += "SUMMARY:" + event.title + "\n";
    ics += "DTSTART:" + event.start.replace(/-/g, "") + "\n";
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";

  let blob = new Blob([ics], { type: 'text/calendar' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familienkalender.ics";
  link.click();
}
