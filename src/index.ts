import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

import type { Event } from './types';

window.Webflow ||= [];
window.Webflow.push(() => {
  const calendarElement = document.querySelector<HTMLDivElement>('[data-element="calendar"]');
  if (!calendarElement) return;

  const events = getEvents();
  console.log(events);

  const calendar = new Calendar(calendarElement, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek',
    },

    events,
  });

  calendar.render();
});

const getEvents = (): Event[] => {
  const scripts = document.querySelectorAll<HTMLScriptElement>('[data-element="event-data"]');
  const events = [...scripts].map((script) => {
    const event: Event = JSON.parse(script.textContent!);
    event.start = new Date(event.start);
    event.end = new Date(event.end);

    return event;
  });

  return events;
};

const rates = {
  Sportstugan: { weekday: 100, weekend: 120 },
  Ladan: { weekday: 80, weekend: 100 },
  Torpet: { weekday: 90, weekend: 110 },
  'Visthuset nedre': { weekday: 110, weekend: 130 },
  'Visthuset övre': { weekday: 110, weekend: 130 },
  Sovstugan: { weekday: 70, weekend: 90 },
  Bastun: { weekday: 60, weekend: 80 },
};

// Update the total price based on the form inputs
function updateTotalPrice() {
  const startDateInput = document.querySelector('input[data-custom="start-date"]');
  const endDateInput = document.querySelector('input[data-custom="end-date"]');
  const selectedLodges = document.querySelectorAll('input[data-custom="lodge"]:checked');
  const isMember = document.querySelector<HTMLFormElement>(
    'input[data-custom="member-checkbox"]'
  ).checked;

  // Convert start and end dates to dd-mm-yyyy format
  const startDate = formatDate(startDateInput.value);
  const endDate = formatDate(endDateInput.value);

  let totalPrice = 0;

  // Calculate the total price based on selected lodges and date range
  const currentDate = new Date(startDate.year, startDate.month - 1, startDate.day);

  while (currentDate <= new Date(endDate.year, endDate.month - 1, endDate.day)) {
    const dayOfWeek = currentDate.getDay();

    selectedLodges.forEach(function (checkbox) {
      const lodge = checkbox.getAttribute('data-lodge-name');
      const rate = dayOfWeek === 0 || dayOfWeek === 6 ? rates[lodge].weekend : rates[lodge].weekday;
      totalPrice += rate;
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Apply member discount if applicable
  if (isMember) {
    totalPrice *= 0.8; // 20% discount for members
  }

  document.getElementById('total-price').textContent = totalPrice.toFixed(0) + ' kr'; // Display total price with 0 decimal places
}

// Helper function to format date as dd-mm-yyyy
function formatDate(dateString) {
  const dateParts = dateString.split('-');
  return {
    day: dateParts[2],
    month: dateParts[1],
    year: dateParts[0],
  };
}

// Add event listeners to form inputs
document
  .querySelector('input[data-custom="start-date"]')
  .addEventListener('change', updateTotalPrice);
document
  .querySelector('input[data-custom="end-date"]')
  .addEventListener('change', updateTotalPrice);
const lodgeCheckboxes = document.querySelectorAll('input[data-custom="lodge"]');
lodgeCheckboxes.forEach(function (checkbox) {
  checkbox.addEventListener('change', updateTotalPrice);
});
document
  .querySelector('input[data-custom="member-checkbox"]')
  .addEventListener('change', updateTotalPrice);
