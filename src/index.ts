import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import flatpickr from 'flatpickr';
import { Swedish } from 'flatpickr/dist/l10n/sv.js';

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

  const lodges = [
    'Sportstugan',
    'Torpet',
    'Ladan',
    'VisthusetNedre',
    'VisthusetÖvre',
    'Sovstugan',
    'Bastun',
  ];

  lodges.forEach((lodge) => {
    flatpickr(`.date-range-${lodge.toLowerCase()}`, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      minDate: new Date().fp_incr(14),
      disable: getBookedDates(lodge),
      onChange: function () {
        updateTotalPrice();
      },
    });
  });
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

const getBookedDates = (lodge: string): string[] => {
  return getEvents()
    .filter((event) => event.lodge === lodge)
    .flatMap((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      const dates = [];
      const currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    });
};

flatpickr.localize(Swedish);

const rates = {
  Sportstugan: { weekday: 1050, weekend: 1550 },
  Ladan: { weekday: 500, weekend: 650 },
  Torpet: { weekday: 800, weekend: 1300 },
  VisthusetNedre: { weekday: 200, weekend: 250 },
  VisthusetÖvre: { weekday: 150, weekend: 200 },
  Sovstugan: { weekday: 250, weekend: 300 },
  Bastun: { weekday: 100, weekend: 100 },
};

// Update the total price based on the form inputs
function updateTotalPrice() {
  const selectedLodges = document.querySelectorAll('input[data-custom="lodge"]:checked');
  const isMember = document.querySelector('input[data-custom="member-checkbox"]').checked;

  let totalPrice = 0;

  selectedLodges.forEach(function (checkbox) {
    const lodge = checkbox.getAttribute('data-lodge-name');
    const dateRangeInput = document.querySelector(
      `input[data-custom="date-range-${lodge.toLowerCase()}"]`
    );

    // Parse the date range input
    const dateRange = dateRangeInput.value.split(' till ');
    const startDateString = dateRange[0];
    const endDateString = dateRange[1];

    // Convert start and end dates to dd-mm-yyyy format
    const startDate = formatDate(startDateString);
    const endDate = formatDate(endDateString);

    // Calculate the total price based on selected lodge and date range
    const currentDate = new Date(startDate.year, startDate.month - 1, startDate.day);

    while (currentDate <= new Date(endDate.year, endDate.month - 1, endDate.day)) {
      const dayOfWeek = currentDate.getDay();

      const rate = dayOfWeek === 0 || dayOfWeek === 6 ? rates[lodge].weekend : rates[lodge].weekday;
      totalPrice += rate;

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // Apply member discount if applicable
  if (isMember) {
    totalPrice *= 0.7; // 30% discount for members
  }

  document.getElementById('total-price').textContent = totalPrice.toFixed(0) + ' kr'; // Display total price with 0 decimal places

  // Update the price input field
  const priceInput = document.querySelector('input[data-custom="price"]');
  priceInput.value = totalPrice.toFixed(0) + ' kr';
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
const lodgeCheckboxes = document.querySelectorAll('input[data-custom="lodge"]');
lodgeCheckboxes.forEach(function (checkbox) {
  checkbox.addEventListener('change', updateTotalPrice);
});

const memberCheckbox = document.querySelector('input[data-custom="member-checkbox"]');
memberCheckbox.addEventListener('change', updateTotalPrice);

lodges.forEach((lodge) => {
  const dateRangeInput = document.querySelector(
    `input[data-custom="date-range-${lodge.toLowerCase()}"]`
  );
  dateRangeInput.addEventListener('change', updateTotalPrice);
});
