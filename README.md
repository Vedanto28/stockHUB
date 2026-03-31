# Stocks CRUD Application

A complete CRUD web application for managing stock records using Node.js, Express.js, PostgreSQL, and vanilla JavaScript.

## Tech Stack

- Node.js 18 or newer
- Express.js
- PostgreSQL with the `pg` library
- HTML, CSS, and vanilla JavaScript

## Database Configuration

The application uses the following PostgreSQL credentials:

- User: `postgres`
- Password: `Ask owner`
- Host: `localhost`
- Port: `5432`
- Database: `postgres`

## Project Files

- `server.js` - Express server and REST API routes
- `db.js` - PostgreSQL connection pool and table initialization
- `public/index.html` - Frontend markup
- `public/style.css` - Frontend styling
- `public/script.js` - Frontend logic using the Fetch API

## Install and Run

Install the required packages:

```bash
npm install
```

Start the application:

```bash
npm start
```

Open the app in your browser:

```text
http://localhost:3000
```

## API Endpoints

- `POST /stocks`
- `GET /stocks`
- `PUT /stocks/:id`
- `DELETE /stocks/:id`

## Notes

- The `stocks` table is created automatically when the server starts.
- All database queries are parameterized to help prevent SQL injection.
- The frontend refreshes automatically after create, update, and delete actions.
