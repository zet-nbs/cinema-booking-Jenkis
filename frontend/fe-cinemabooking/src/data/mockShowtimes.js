import { mockMovies } from './mockMovies';
const now = '2026-07-07T00:00:00.000Z';
export const mockHalls = [
    {
        _id: 'hall-1',
        hall_name: 'Studio 1',
        total_seats: 100,
        layout_rows: 10,
        layout_columns: 10,
        is_active: true,
        createdAt: now,
        updatedAt: now,
    },
    {
        _id: 'hall-2',
        hall_name: 'Studio 2',
        total_seats: 100,
        layout_rows: 10,
        layout_columns: 10,
        is_active: true,
        createdAt: now,
        updatedAt: now,
    },
    {
        _id: 'hall-3',
        hall_name: 'Premiere Hall',
        total_seats: 100,
        layout_rows: 10,
        layout_columns: 10,
        is_active: true,
        createdAt: now,
        updatedAt: now,
    },
];
const movie = (id) => mockMovies.find((item) => item._id === id);
const hall = (id) => mockHalls.find((item) => item._id === id);
export const mockShowtimes = [
    { _id: 'showtime-1', movie: movie('movie-1'), hall: hall('hall-1'), show_date: '2026-07-08T00:00:00.000Z', start_time: '13:00', end_time: '15:08', ticket_price: 55000 },
    { _id: 'showtime-2', movie: movie('movie-1'), hall: hall('hall-2'), show_date: '2026-07-08T00:00:00.000Z', start_time: '19:30', end_time: '21:38', ticket_price: 65000 },
    { _id: 'showtime-3', movie: movie('movie-2'), hall: hall('hall-1'), show_date: '2026-07-08T00:00:00.000Z', start_time: '16:00', end_time: '17:56', ticket_price: 50000 },
    { _id: 'showtime-4', movie: movie('movie-3'), hall: hall('hall-3'), show_date: '2026-07-09T00:00:00.000Z', start_time: '20:00', end_time: '22:22', ticket_price: 85000 },
    { _id: 'showtime-5', movie: movie('movie-4'), hall: hall('hall-2'), show_date: '2026-07-09T00:00:00.000Z', start_time: '18:45', end_time: '20:29', ticket_price: 60000 },
    { _id: 'showtime-6', movie: movie('movie-5'), hall: hall('hall-1'), show_date: '2026-07-10T00:00:00.000Z', start_time: '14:30', end_time: '16:08', ticket_price: 45000 },
    { _id: 'showtime-7', movie: movie('movie-6'), hall: hall('hall-3'), show_date: '2026-08-15T00:00:00.000Z', start_time: '17:00', end_time: '19:01', ticket_price: 75000 },
    { _id: 'showtime-8', movie: movie('movie-8'), hall: hall('hall-2'), show_date: '2026-08-01T00:00:00.000Z', start_time: '11:00', end_time: '12:50', ticket_price: 50000 },
    { _id: 'showtime-9', movie: movie('movie-9'), hall: hall('hall-2'), show_date: '2026-07-10T00:00:00.000Z', start_time: '17:15', end_time: '18:45', ticket_price: 50000 },
    { _id: 'showtime-10', movie: movie('movie-10'), hall: hall('hall-1'), show_date: '2026-07-10T00:00:00.000Z', start_time: '12:00', end_time: '13:40', ticket_price: 45000 },
    { _id: 'showtime-11', movie: movie('movie-11'), hall: hall('hall-2'), show_date: '2026-07-11T00:00:00.000Z', start_time: '13:30', end_time: '15:06', ticket_price: 50000 },
    { _id: 'showtime-12', movie: movie('movie-12'), hall: hall('hall-3'), show_date: '2026-07-11T00:00:00.000Z', start_time: '18:30', end_time: '21:30', ticket_price: 85000 },
    { _id: 'showtime-13', movie: movie('movie-13'), hall: hall('hall-1'), show_date: '2026-07-12T00:00:00.000Z', start_time: '15:45', end_time: '18:13', ticket_price: 60000 },
    { _id: 'showtime-14', movie: movie('movie-14'), hall: hall('hall-2'), show_date: '2026-07-12T00:00:00.000Z', start_time: '20:15', end_time: '22:26', ticket_price: 65000 },
    { _id: 'showtime-15', movie: movie('movie-15'), hall: hall('hall-3'), show_date: '2026-07-13T00:00:00.000Z', start_time: '16:20', end_time: '19:09', ticket_price: 80000 },
    { _id: 'showtime-16', movie: movie('movie-16'), hall: hall('hall-1'), show_date: '2026-07-13T00:00:00.000Z', start_time: '19:00', end_time: '21:08', ticket_price: 55000 },
];
