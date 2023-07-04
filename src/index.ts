import flatpickr from 'flatpickr';
import { Swedish } from 'flatpickr/dist/l10n/sv.js';

import type { Event } from './types';

window.Webflow ||= [];
window.Webflow.push(() => {
  const events = getEvents();
  console.log(events);

  const lodges = [
    'sportstugan',
    'torpet',
    'ladan',
    'visthusetnedre',
    'visthusetovre',
    'sovstugan',
    'bastun',
  ];

  lodges.forEach((lodge) => {
    flatpickr(`#${lodge.toLowerCase()}`, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      minDate: new Date().fp_incr(14),
      disable: getBookedDates(lodge),
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

flatpickr.localize(Swedish);
