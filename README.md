# RailServe – Railway Station Management System

RailServe is a database-driven web application developed as part of the Database Management Systems course. The system provides a centralized platform to manage railway operations including stations, trains, schedules, passengers, ticketing, reservations, and payments.

---

## Abstract

The Railway Station Management System is designed to efficiently manage railway operations through a structured and centralized database system. It integrates multiple modules such as train scheduling, passenger management, ticket booking, reservation tracking, and payment handling.

The system ensures data consistency, reduces redundancy, and improves operational efficiency by storing all information in a relational database.

---

## Problem Statement

Railway systems handle large volumes of data related to trains, platforms, passengers, reservations, and payments. Manual or disconnected systems lead to redundancy, inconsistency, and inefficiency.

The objective of this project is to design a centralized database system that organizes and manages railway data efficiently using proper database design techniques such as ER modeling, relational schema mapping, and normalization.

---

## Proposed System

- Centralized database for railway operations  
- Integration of all modules into a single system  
- Real-time data access and updates  
- Reduced redundancy and improved data consistency  
- Efficient handling of scheduling, ticketing, and payments

---

## System Architecture

The system follows a three-tier architecture:

1. **Presentation Layer (Frontend)**  
   HTML, CSS, and JavaScript for user interface  

2. **Application Layer (Backend)**  
   Node.js for API handling and business logic  

3. **Data Layer (Database)**  
   Oracle SQL for structured data storage  

This architecture ensures scalability, maintainability, and efficient data flow. 

---

## Technology Stack

- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js  
- Database: Oracle SQL  
- Tools: VS Code 

---

## Database Design

The system consists of the following relations:

- STATION  
- TRAIN  
- PLATFORM  
- TRAIN_SCHEDULE  
- PASSENGER  
- TICKET  
- RESERVATION  
- PAYMENT  

All relations are normalized up to **BCNF**, ensuring minimal redundancy and maintaining data integrity.

---

## Functional Modules

1. Station Management  
2. Train Management  
3. Platform Management  
4. Train Scheduling  
5. Passenger Management  
6. Ticket Management  
7. Reservation Management  
8. Payment Management

---

## System Workflow

1. Admin logs into the system  
2. Operations such as managing trains, passengers, and tickets are performed  
3. Frontend sends requests to backend APIs  
4. Backend interacts with Oracle database  
5. Data is processed and returned to frontend  
6. Updated information is displayed to the user

---

## Key Features

- Centralized database management  
- Full CRUD operations on all entities  
- Integrated reservation and payment tracking  
- Real-time data updates  
- Modular and scalable design  

---

## Conclusion

The system demonstrates the practical implementation of database design and full-stack development concepts. By automating railway operations and maintaining structured data, the system improves efficiency, reduces errors, and ensures consistency across all modules.

---

## References

- MDN Web Docs – HTML, CSS, JavaScript  
- JavaScript.info  
- GeeksforGeeks – DBMS and Normalization  
- W3Schools – Node.js

---

## Author

Anvita Arun  
II Year B.Tech CSE  
VIT Chennai
