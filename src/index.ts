import flatpickr from 'flatpickr';
import { Swedish } from 'flatpickr/dist/l10n/sv.js';

import type { Event } from './types';

const getEvents = (): Event[] => {
  const scripts = document.querySelectorAll<HTMLScriptElement>('[data-element="event-data"]');
  const events = [...scripts].map((script) => {
    const event: Event = JSON.parse(script.textContent!);
    event.start = new Date(event.start);
    event.end = new Date(event.end);
    event.end.setDate(event.end.getDate() - 1);

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

  const lodges = Object.keys(lodgeRates);

  const fp = lodges.forEach((lodge) => {
    flatpickr(`#${lodge.toLowerCase()}`, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      minDate: new Date().fp_incr(14),
      disable: getBookedDates(lodge),
      onChange: function (selectedDates) {
        const startDate = selectedDates[0] ? selectedDates[0].toISOString().split('T')[0] : '';
        const endDate = selectedDates[1] ? selectedDates[1].toISOString().split('T')[0] : '';

        const memberDiscount = document.getElementById('member-discount').checked;

        const totalPrice = calculateTotalPrice(
          startDate,
          endDate,
          memberDiscount,
          lodgeRates[lodge]
        );
        document.getElementById('total-price').textContent = totalPrice.toString();
      },
    });
  });
});

function calculateTotalPrice(startDate, endDate, memberDiscount, lodgeRate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  let totalPrice = 0;

  const currentDate = new Date(start);
  while (currentDate < end) {
    const isWeekend = currentDate.getDay() === 5 || currentDate.getDay() === 4;
    const nightlyRate = isWeekend ? lodgeRate.weekendRate : lodgeRate.weekdayRate;

    if (memberDiscount) {
      totalPrice += nightlyRate * 0.7;
    } else {
      totalPrice += nightlyRate;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalPrice;
}

flatpickr.localize(Swedish);
