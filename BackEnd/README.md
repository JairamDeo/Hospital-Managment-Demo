/*************  ✨ Windsurf Command ⭐  *************/
# BackEnd

This is the backend for the Hospital Management System (HMS). It is a RESTful API built using Node.js, Express.js, and MongoDB.

## Getting Started

1. Clone the repository
2. Install the dependencies by running `npm install`
3. Start the server by running `npm run dev`

## API Endpoints

The API endpoints are as follows:

### Authentication

* `POST /login`: Logs in a user and returns a JWT token
* `POST /register`: Registers a new user and returns a JWT token

### Patients

* `GET /patients`: Returns a list of all patients
* `GET /patients/:id`: Returns a single patient by ID
* `POST /patients`: Creates a new patient and returns the patient object
* `PUT /patients/:id`: Updates a single patient and returns the updated patient object
* `DELETE /patients/:id`: Deletes a single patient and returns a success message

### Appointments

* `GET /appointments`: Returns a list of all appointments
* `GET /appointments/:id`: Returns a single appointment by ID
* `POST /appointments`: Creates a new appointment and returns the appointment object
* `PUT /appointments/:id`: Updates a single appointment and returns the updated appointment object
* `DELETE /appointments/:id`: Deletes a single appointment and returns a success message

## Development

The project uses the following technologies:

* Node.js: The runtime environment for the server
* Express.js: The web framework for the server
* MongoDB: The database for storing data
* Mongoose: The ORM for interacting with MongoDB
* TypeScript: The language for writing the server code
* ESLint: The linter for checking the code for errors
* Prettier: The code formatter for keeping the code clean and consistent

The project follows the following conventions:

* The server code is written in TypeScript and is located in the `src` directory
* The database models are located in the `src/models` directory
* The routes are located in the `src/routes` directory
* The controllers are located in the `src/controllers` directory
* The validators are located in the 'src/validators' directory
* The services are located in the `src/services` directory
* The tests are located in the `src/tests` directory

The project uses the following tools:

* `npm`: The package manager for installing dependencies
* `nodemon`: The development server for automatically restarting the server when changes are made
* `ts-node`: The runtime environment for running TypeScript code directly
* `jest`: The testing framework for writing unit tests
* `supertest`: The testing library for writing integration tests

The project follows the following best practices:

* The code is written in a modular and reusable way
* The code is kept clean and consistent
* The code is tested thoroughly
* The code is commented and documented
* The code is kept up-to-date with the latest technologies and best practices

