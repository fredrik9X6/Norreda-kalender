import flatpickr from 'flatpickr';
import { Swedish } from 'flatpickr/dist/l10n/sv.js';

import type { Event } from './types';

const getEvents = (): Event[] => {
  const scripts = document.querySelectorAll<HTMLScriptElement>('[data-element="event-data"]');
  const events = [...scripts].map((script) => {
    const event: Event = JSON.parse(script.textContent!);
    event.start = new Date(event.start);
    event.end = new Date(event.end);

    return event;
  });

  // Get the last part of the current URL
  const currentUrl = window.location.href;
  const lastPart = currentUrl.substr(currentUrl.lastIndexOf('/') + 1);

  // Filter items where "stugaid" matches the last part of the URL
  const filteredEvents = events.filter((event) => event.stugaid === lastPart);

  return filteredEvents;
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
      //remove the two first dates
      dates.shift();
      dates.shift();

      return dates;
    });
};

window.Webflow ||= [];
window.Webflow.push(() => {
  const events = getEvents();
  console.log(events);

  const lodgeRates = {
    sportstugan: {
      weekdayRate: 1050,
      weekendRate: 1550,
    },
    torpet: {
      weekdayRate: 800,
      weekendRate: 1300,
    },
    ladan: {
      weekdayRate: 500,
      weekendRate: 650,
    },
    visthusetnedre: {
      weekdayRate: 200,
      weekendRate: 250,
    },
    visthusetovre: {
      weekdayRate: 150,
      weekendRate: 200,
    },
    sovstugan: {
      weekdayRate: 250,
      weekendRate: 300,
    },
    bastun: {
      weekdayRate: 100,
      weekendRate: 100,
    },
  };

  let CurrentSelectedDates = []; //to store selected dates

  const lodges = Object.keys(lodgeRates);

  const fp = lodges.forEach((lodge) => {
    flatpickr(`#${lodge.toLowerCase()}`, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      minDate: new Date(),
      disable: getBookedDates(lodge),
      onChange: function (selectedDates) {
        const startDate = selectedDates[0] ? selectedDates[0].toISOString().split('T')[0] : '';
        const endDate = selectedDates[1] ? selectedDates[1].toISOString().split('T')[0] : '';

        const memberDiscount = document.getElementById('member-discount').checked;
        const tillaggCheckbox = document.getElementById('tillagg');
        const tillaggChecked = tillaggCheckbox ? tillaggCheckbox.checked : false;

        CurrentSelectedDates = selectedDates;

        const totalPrice = calculateTotalPrice(
          startDate,
          endDate,
          memberDiscount,
          tillaggChecked,
          lodgeRates[lodge]
        );
        document.getElementById('total-price').textContent = totalPrice.toString();
        appendPriceInput(totalPrice);
      },
    });
  });
  // updating the price when the member discount checkbox is clicked
  document.getElementById('tillagg').addEventListener('change', function () {
    const startDate = CurrentSelectedDates[0]
      ? CurrentSelectedDates[0].toISOString().split('T')[0]
      : ''; // Get the selected start date
    const endDate = CurrentSelectedDates[1]
      ? CurrentSelectedDates[1].toISOString().split('T')[0]
      : ''; // Get the selected end date
    const memberDiscount = document.getElementById('member-discount').checked;
    const tillaggChecked = this.checked; // Get the checked state of the checkbox

    const currentUrl = window.location.href; // Get the lodge value
    const lastPart = currentUrl.substr(currentUrl.lastIndexOf('/') + 1); // Get the lodge value
    const lodge = lastPart; // Get the lodge value
    const totalPrice = calculateTotalPrice(
      startDate,
      endDate,
      memberDiscount,
      tillaggChecked,
      lodgeRates[lodge]
    );

    document.getElementById('total-price').textContent = totalPrice.toString();
    appendPriceInput(totalPrice);
  });

  // updating the total price when member discount is checked
  document.getElementById('member-discount').addEventListener('change', function () {
    const startDate = CurrentSelectedDates[0]
      ? CurrentSelectedDates[0].toISOString().split('T')[0]
      : ''; // Get the selected start date
    const endDate = CurrentSelectedDates[1]
      ? CurrentSelectedDates[1].toISOString().split('T')[0]
      : ''; // Get the selected end date
    const memberDiscount = document.getElementById('member-discount').checked;
    const tillaggCheckbox = document.getElementById('tillagg');
    const tillaggChecked = tillaggCheckbox ? tillaggCheckbox.checked : false; // Get the checked state of the checkbox

    const currentUrl = window.location.href; // Get the lodge value
    const lastPart = currentUrl.substr(currentUrl.lastIndexOf('/') + 1); // Get the lodge value
    const lodge = lastPart; // Get the lodge value
    const totalPrice = calculateTotalPrice(
      startDate,
      endDate,
      memberDiscount,
      tillaggChecked,
      lodgeRates[lodge]
    );

    document.getElementById('total-price').textContent = totalPrice.toString();
    appendPriceInput(totalPrice);
  });
});

function appendPriceInput(totalPrice) {
  const priceInput = document.getElementById('price-input');
  priceInput.value = totalPrice.toString();
}

function calculateTotalPrice(startDate, endDate, memberDiscount, tillaggChecked, lodgeRate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalPrice = 0;

  const currentDate = new Date(start);
  while (currentDate < end) {
    const isWeekend = currentDate.getDay() === 5 || currentDate.getDay() === 4;
    const nightlyRate = isWeekend ? lodgeRate.weekendRate : lodgeRate.weekdayRate;

    totalPrice += nightlyRate;

    if (tillaggChecked) {
      totalPrice += 100; // Add 100 for each day booked
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (memberDiscount) {
    totalPrice *= 0.7; // Add 30% discount
  }
  return totalPrice.toFixed(0);
}

flatpickr.localize(Swedish);
