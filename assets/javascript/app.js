"use strict";

const schedulesPath = "schedules/";

let schedules = new Map();


class Schedule {
  constructor(trainName, destination, firstDeparture, frequency) {
    this.trainName = trainName;
    this.destination = destination;
    this.firstDeparture = firstDeparture;
    this.frequency = frequency;
  }
}


function addSchedule(data, key) {
  const schedule = new Schedule(data.trainName, data.destination, data.firstDeparture, data.frequency);
  schedules.set(key, schedule);

  const row = $("<tr>");
  row.attr("data-key", key);

  const name = $("<td>").text(schedule.trainName);
  const destination = $("<td>").text(schedule.destination);
  const firstDeparture = $("<td>").text(schedule.firstDeparture);
  const frequency = $("<td>").text(schedule.frequency);

  row.append(name);
  row.append(destination);
  row.append(firstDeparture);
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

  const database = firebase.database();
  const ref = database.ref(schedulesPath);

  ref.on("child_added", onScheduleAdded);
  ref.on("child_changed", onScheduleChanged);
  ref.on("child_removed", onScheduleRemoved);
});
