const fs = require("fs");

const events = JSON.parse(fs.readFileSync("events.json", "utf8"));

let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Familienkalender//DE\n";

events.forEach(event => {

  const startObj = new Date(event.start);
  const endObj = new Date(startObj);

  if (!event.allDay) {
    endObj.setHours(endObj.getHours() + 1);
  }

  ics += "BEGIN:VEVENT\n";
  ics += "UID:" + event.id + "@familienkalender\n";
  ics += "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z\n";
  ics += "SUMMARY:" + event.title + "\n";

  if (event.allDay) {

    const dateOnly = event.start.split("T")[0].replace(/-/g, "");

    ics += "DTSTART;VALUE=DATE:" + dateOnly + "\n";
    ics += "DTEND;VALUE=DATE:" + dateOnly + "\n";
    ics += "X-GWALLDAYEVENT:TRUE\n";

  } else {

    const dtStart = startObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd = endObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += "DTSTART:" + dtStart + "\n";
    ics += "DTEND:" + dtEnd + "\n";
  }

  ics += "CLASS:PUBLIC\n";
  ics += "END:VEVENT\n";
});

ics += "END:VCALENDAR";

fs.writeFileSync("familienkalender.ics", ics);
console.log("ICS Datei erzeugt.");
