"use strict";

const schedulesPath = "schedules/";
const secondsBetweenUpdates = 60;

let database = null;
let schedules = new Map();
let updateInterval = null;

class Schedule {
  constructor(trainName, destination, firstDeparture, frequency) {
    this.trainName = trainName;
    this.destination = destination;
    this.firstDeparture = firstDeparture;
    this.frequency = frequency;
  }
}


function setDuration(time, minutesString) {
  const value = parseInt(minutesString);
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  let text = "";
  let duration = "PT";
  if (hours > 0) {
    text += hours + " hours";
    duration += hours + "H";
  }
  if (minutes > 0) {
    text += " " + minutes + " minutes";
    duration += minutes + "M";
  }

  time.text(text);
  time.attr("datetime", duration);
}

function setTimes(schedule, minutesUntilDepartureCell, nextDepartureCell) {
  const unixTime = moment.unix(parseInt(schedule.firstDeparture));
  const now = moment();
  const minutesAgo = now.diff(unixTime, "minutes");
  const frequency = parseInt(schedule.frequency);
  const minutesUntilDeparture = frequency - (minutesAgo % frequency);
  const nextDepartureUnformatted = now.add(minutesUntilDeparture, "minutes");
  const nextDepartureMoment = moment(nextDepartureUnformatted);
  const nextDeparture = nextDepartureMoment.format("hh:mm A");

  const minutesTime = $("<time>");
  setDuration(minutesTime, minutesUntilDeparture);
  minutesUntilDepartureCell.empty();
  minutesUntilDepartureCell.append(minutesTime);
  minutesUntilDepartureCell.addClass("time-until-departure");

  const nextTime = $("<time>");
  nextTime.attr("datetime", nextDepartureMoment.format());
  nextTime.text(nextDeparture);
  nextDepartureCell.empty();
  nextDepartureCell.append(nextTime);
  nextDepartureCell.addClass("next-departure");
}

function updateScheduleTimes() {
  for (const [key, schedule] of schedules) {
    const row = getRowByKey(key);
    const timeUntilDeparture = row.find(".time-until-departure");
    const nextDeparture = row.find(".next-departure");
    setTimes(schedule, timeUntilDeparture, nextDeparture);
  }
}

function getRowByKey(key) {
  return $("#schedules-body tr[data-key=\"" + key + "\"]");
}

function addSchedule(data, key) {
  const schedule = new Schedule(data.trainName, data.destination, data.firstDeparture, data.frequency);
  schedules.set(key, schedule);

  const row = $("<tr>");
  row.attr("data-key", key);

  const name = $("<td>").text(schedule.trainName);
  const destination = $("<td>").text(schedule.destination);
  const timeUntilDeparture = $("<td>");
  const nextDeparture = $("<td>");

  const frequencyTime = $("<time>");
  setDuration(frequencyTime, schedule.frequency);
  const frequency = $("<td>");
  frequency.empty();
  frequency.append(frequencyTime);

  const removal = $("<td>");
  const remove = $("<button type=\"button\">");
  remove.addClass("btn");
  remove.addClass("btn-secondary");
  remove.text("Remove");
  remove.click(() => {
    const ref = database.ref(schedulesPath + key);
    ref.remove();
  });
  removal.append(remove);

  setTimes(schedule, timeUntilDeparture, nextDeparture);

  row.append(name);
  row.append(destination);
  row.append(timeUntilDeparture);
  row.append(nextDeparture);
  row.append(frequency);
  row.append(removal);

  $("#schedules-body").append(row);
}

function changeSchedule(data, key) {
  removeSchedule(key);
  addSchedule(data, key);
}

function removeSchedule(key) {
  const oldRow = getRowByKey(key);
  oldRow.remove();
}

function onScheduleAdded(snapshot) {
  const data = snapshot.val();
  if (data !== null) {
    addSchedule(data, snapshot.key);
  }
}

function onScheduleChanged(snapshot) {
  const schedule = schedules.get(snapshot.key);
  if (schedule !== undefined) {
    changeSchedule(snapshot.val(), snapshot.key);
  }
}

function onScheduleRemoved(snapshot) {
  schedules.delete(snapshot.key);
  removeSchedule(snapshot.key);
}

function checkInput(id, message) {
  const input = $("#" + id);
  if (!input[0].validity.valid) {
    $("#" + id + "-feedback").text(message);
  }
}

function onSubmitSchedule(form) {
  let formValid = form[0].checkValidity();

  if (!formValid) {
    checkInput("train-name", "Please enter a name.");
    checkInput("destination", "Please enter a city name.");
    checkInput("first-departure", "Please enter a valid date and time.");
    checkInput("frequency", "Please enter a valid number.");
  }

  const trainName = $("#train-name").val();
  const destination = $("#destination").val();
  const firstDepartureUnformatted = $("#first-departure").val();
  const frequency = $("#frequency").val();

  const startTime = moment(firstDepartureUnformatted, "MM/DD/YYYY HH:mm");

  if (!startTime.isValid()) {
    const message = "Please enter the date and time in the correct format.";
    $("#first-departure-feedback").text(message);
    $("#first-departure")[0].setCustomValidity(message);

    formValid = false;
  } else {
    $("#first-departure")[0].setCustomValidity("");
  }
  
  if (formValid) {
    const firstDeparture = startTime.format("X");

    const ref = database.ref(schedulesPath);
    ref.push().set({
      trainName: trainName,
      destination: destination,
      firstDeparture: firstDeparture,
      frequency: frequency,
    });

    form.removeClass("was-validated");
    $("#train-name")[0].setCustomValidity("");
    $("#destination")[0].setCustomValidity("");
    $("#first-departure")[0].setCustomValidity("");
    $("#frequency")[0].setCustomValidity("");

    form.trigger("reset");
  } else {
    form.addClass("was-validated");
  }
}


$(document).ready(() => {
  const config = {
    apiKey: "AIzaSyAbXWNiyM_YH553S4L4cDvIlBP1EvBu9mI",
    authDomain: "train-scheduler-2e3b3.firebaseapp.com",
    databaseURL: "https://train-scheduler-2e3b3.firebaseio.com",
    projectId: "train-scheduler-2e3b3",
    storageBucket: "train-scheduler-2e3b3.appspot.com",
    messagingSenderId: "264628283963"
  };

  firebase.initializeApp(config);

  database = firebase.database();
  const ref = database.ref(schedulesPath);

  ref.on("child_added", onScheduleAdded);
  ref.on("child_changed", onScheduleChanged);
  ref.on("child_removed", onScheduleRemoved);

  $("#add-schedule").submit((event) => {
    const form = $(event.currentTarget);
    event.preventDefault();
    onSubmitSchedule(form);
  });

  updateInterval = setInterval(updateScheduleTimes, 1000 * secondsBetweenUpdates);
});
