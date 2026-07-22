import { initialMockBookings } from '@/data/mockBookings';
import { mockHalls, mockShowtimes } from '@/data/mockShowtimes';
import { mockMovies } from '@/data/mockMovies';
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);
let movies = clone(mockMovies);
let halls = clone(mockHalls);
let showtimes = clone(mockShowtimes);
let bookings = clone(initialMockBookings);
export const mockStore = {
    getMovies: () => clone(movies),
    setMovies: (next) => {
        movies = clone(next);
    },
    getHalls: () => clone(halls),
    setHalls: (next) => {
        halls = clone(next);
    },
    getShowtimes: () => clone(showtimes),
    setShowtimes: (next) => {
        showtimes = clone(next);
    },
    getBookings: () => clone(bookings),
    setBookings: (next) => {
        bookings = clone(next);
    },
};
