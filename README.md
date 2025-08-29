# Upupa

This project is a small management application designed for a conservationist working on a cave-nesting bird project. It provides a set of tools to help track, manage, and analyze data from artificial nest boxes. The software is built with an offline-first approach, ensuring that fieldwork can be done without an internet connection. 

The project is in a very early stage. Don't expect it to work with an empty database, don't even try to use it without contacting me. Currently in german, but first steps for internationalization are done.

## Features

Overview: Visualize nest box locations and current status on an interactive map.

Status: View detailed current status and past inspections.

Standardized Data Entry: Easily log inspections with a user-friendly interface.

Calendar: Visualize when banding is due in which box.

Analysis: Generate insightful charts and graphs from your collected data.

## Technology Stack

I have adopted a minimalist approach, aiming to use as few external libraries as possible to reduce dependencies and complexity.

This application is composed of a backend and a frontend:

Backend: A tiny Node.js/Express server that mainly serves the frontend and proxies all api requests to a CouchDB database. Even authentication and user management are done by CouchDB.

Frontend: A offline-first progressive web app built with Lit web components and PouchDB. Charts are done with d3 and @observablehq/plot. No UI widget library, just standard html forms.

## Deployment

The project includes an automated deployment pipeline. A GitHub Action builds the frontend into a Progressive Web App (PWA) including a service worker and packages both the backend and frontend into a single Docker container, ready for deployment.



