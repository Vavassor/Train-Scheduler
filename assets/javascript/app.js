"use strict";

const schedulesPath = "schedules/";

let database = null;
let schedules = new Map();

class Schedule {
  constructor(trainName, destination, firstDeparture, frequency) {
    this.trainName = trainName;
    this.destination = destination;
    this.firstDeparture = firstDeparture;
    this.frequency = frequency;
  }
}


function setTimes(schedule, minutesUntilDepartureCell, nextDepartureCell) {
  const unixTime = moment.unix(parseInt(schedule.firstDeparture));
  const now = moment();
  const minutesAgo = now.diff(unixTime, "minutes");
  const minutesUntilDeparture = minutesAgo % parseInt(schedule.frequency);
  const nextDepartureUnformatted = now.add(minutesUntilDeparture, "minutes");
  const nextDeparture = moment(nextDepartureUnformatted).format("hh:mm A");

  minutesUntilDepartureCell.text(minutesUntilDeparture);
  nextDepartureCell.text(nextDeparture);
}

function addSchedule(data, key) {
  const schedule = new Schedule(data.trainName, data.destination, data.firstDeparture, data.frequency);
  schedules.set(key, schedule);

  const row = $("<tr>");
  row.attr("data-key", key);

  const name = $("<td>").text(schedule.trainName);
  const destination = $("<td>").text(schedule.destination);
  const minutesUntilDeparture = $("<td>");
  const nextDeparture = $("<td>");
  const frequency = $("<td>").text(schedule.frequency);

  setTimes(schedule, minutesUntilDeparture, nextDeparture);

  row.append(name);
  row.append(destination);
  row.append(minutesUntilDeparture);
  row.append(nextDeparture);
  row.append(frequency);

  $("#schedules-body").append(row);
}

function changeSchedule(data, key) {
  removeSchedule(key);
  addSchedule(data, key);
}

function removeSchedule(key) {
  const oldRow = $("#schedules-body tr[data-key=\"" + key + "\"]");
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
    input.addClass("invalid-input");
    $("#" + id + "-feedback").text(message);
  }
}

function resetInput(id) {
  $("#" + id + "-feedback").empty();
  $("#" + id).removeClass("invalid-input");
}

function resetFeedback() {
  resetInput("train-name");
  resetInput("destination");
  resetInput("first-departure");
  resetInput("frequency");
}

function onSubmitSchedule(form) {
  resetFeedback();

  if (!form[0].checkValidity()) {
    checkInput("train-name", "Please enter a name.");
    checkInput("destination", "Please enter a city name.");
    checkInput("first-departure", "Please enter a date and time.");
    checkInput("frequency", "Please enter a number.");
  } else {
    const trainName = $("#train-name").val();
    const destination = $("#destination").val();
    const firstDepartureUnformatted = $("#first-departure").val();
    const frequency = $("#frequency").val();

    const startTime = moment(firstDepartureUnformatted, "MM/DD/YYYY HH:mm");

    if (!startTime.isValid()) {
      $("#first-departure-feedback").text("Please enter the date and time in the correct format.");
    } else {
      const firstDeparture = startTime.format("X");

      const ref = database.ref(schedulesPath);
      ref.push().set({
        trainName: trainName,
        destination: destination,
        firstDeparture: firstDeparture,
        frequency: frequency,
      });

      form.trigger("reset");
    }
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
});
