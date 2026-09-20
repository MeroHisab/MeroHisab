# MeroHisab

### AI-Powered Voice-Based Business Management for Small Retailers

[![Status](https://img.shields.io/badge/status-in%20development-orange)](#project-status)
[![Python](https://img.shields.io/badge/Python-3.x-blue)](#technology-stack)
[![AI](https://img.shields.io/badge/AI-NLP%20%7C%20Voice-purple)](#ai-and-nlp)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](#license)

> **MeroHisab is an AI-powered, voice-first business management system designed to help small retailers record, manage, and understand their daily business transactions using natural language.**

---

## 📌 Overview

Small retailers often manage their businesses using notebooks, calculators, memory, spreadsheets, or informal records. While these approaches may work for basic day-to-day operations, they can make it difficult to maintain accurate records, track customer credit, monitor expenses, and understand overall business performance.

**MeroHisab** aims to simplify this process through a voice-first interface.

Instead of navigating complex forms or manually entering multiple fields, a shopkeeper can describe a transaction naturally. The system processes the voice input, identifies the user's intent, extracts relevant information, validates the transaction, and stores it as structured business data.

For example, a shopkeeper could say:

> **"Ram le 500 rupaiya ko udharo lagyo."**

The system can interpret this as a customer-credit transaction, extract the customer and amount, and record the transaction accordingly.

The user can later ask:

> **"How much credit does Ram have outstanding?"**

or:

> **"What were my total sales this month?"**

The long-term goal is to make digital business management **simpler, more accessible, and more natural for small retailers.**

---

# 🎯 Problem Statement

Small and informal retailers frequently face challenges in maintaining and interpreting business records.

Common challenges include:

* Manual record keeping
* Inconsistent transaction recording
* Difficulty tracking customer credit
* Difficulty tracking partial repayments
* Time-consuming calculation
* Limited visibility into monthly performance
* Difficulty determining actual business profit
* Loss or misplacement of handwritten records
* Complicated digital accounting interfaces
* Difficulty using systems that require extensive typing or technical knowledge

These challenges create a need for a system that can capture business information with **minimal interaction and low technical complexity**.

---

# 💡 Proposed Solution

MeroHisab proposes a **voice-first business management system** that combines:

* Speech recognition
* Natural Language Processing
* Intent classification
* Entity extraction
* Transaction validation
* Structured business data storage
* Business analytics
* Natural language querying

The system is designed around a simple principle:

> **Speak naturally. Record automatically. Understand your business.**

---

# 🎯 Project Objectives

The primary objectives of MeroHisab are to:

1. Simplify business transaction recording for small retailers.
2. Enable voice-based transaction entry using natural language.
3. Reduce dependency on manual bookkeeping.
4. Provide structured management of sales, expenses, and customer credit.
5. Enable users to query their business information using natural language.
6. Generate meaningful business summaries from recorded transactions.
7. Improve accessibility to digital business management tools.
8. Explore the practical application of NLP and AI in small-business environments.

---

# ✨ Key Features

## 1. Voice-Based Transaction Recording

Users can record transactions using natural speech rather than manually completing forms.

Supported transaction types may include:

* Sales
* Expenses
* Customer credit
* Credit repayments
* Purchases
* Other business transactions

### Example

**Voice Input**

> "Ram le 500 rupaiya ko udharo lagyo."

**Extracted Information**

| Field            | Value        |
| ---------------- | ------------ |
| Customer         | Ram          |
| Transaction Type | Credit       |
| Amount           | NPR 500      |
| Date             | Current date |
| Status           | Outstanding  |

---

## 2. Natural Language Understanding

The system is designed to understand flexible user expressions instead of requiring predefined commands.

For example, these could represent the same intent:

> "Ram has taken 500 on credit."

> "Ram le 500 ko udharo lagyo."

> "Add 500 credit for Ram."

The NLP layer identifies the underlying intent and relevant entities.

---

## 3. Customer Credit Management

MeroHisab provides structured management of customer credit.

Potential capabilities include:

* Recording new credit
* Recording repayments
* Tracking outstanding balances
* Viewing customer credit history
* Tracking partial payments
* Identifying customers with outstanding balances
* Calculating total outstanding credit

Example query:

> "How much does Ram still owe?"

---

## 4. Sales Management

The system can maintain records of business sales and provide summaries such as:

* Daily sales
* Weekly sales
* Monthly sales
* Sales by product
* Sales trends
* Transaction history

Example:

> "What were my total sales this month?"

---

## 5. Expense Management

Users can record business expenses and categorize them where applicable.

Possible expense categories include:

* Inventory purchases
* Rent
* Utilities
* Transportation
* Supplies
* Maintenance
* Other operating expenses

---

## 6. Business Performance Summary

The system can transform raw transaction records into meaningful summaries.

Potential metrics include:

* Total sales
* Total expenses
* Estimated profit
* Total credit issued
* Total credit collected
* Outstanding credit
* Total purchases
* Sales trends
* Expense trends

Example:

```text
Monthly Sales        : NPR 150,000
Monthly Expenses     : NPR 95,000
Estimated Profit     : NPR 55,000
Outstanding Credit   : NPR 18,500
```

> Financial results depend on the completeness and accuracy of the recorded transaction data.

---

## 7. Natural Language Business Queries

Users can retrieve information without manually navigating through multiple screens.

Examples:

```text
What were today's total sales?

How much did I spend this month?

How much credit is currently outstanding?

How much does Ram owe?

What was my estimated profit this month?

Which product sold the most?

How much credit was collected this month?
```

---

## 8. Transaction History

Users can review previously recorded transactions, including:

* Date and time
* Transaction type
* Amount
* Customer
* Product
* Payment status
* Category
* Notes

---

# 🧠 AI & NLP

AI is a core component of MeroHisab.

The system is designed to convert unstructured human language into structured business information.

### NLP Pipeline

```text
Voice Input
     │
     ▼
Speech-to-Text
     │
     ▼
Text Normalization
     │
     ▼
Intent Detection
     │
     ▼
Entity Extraction
     │
     ▼
Transaction Validation
     │
     ▼
Business Logic
     │
     ▼
Database
     │
     ▼
Natural Language Response
```

### Intent Detection

The system may identify intents such as:

```text
RECORD_SALE
RECORD_EXPENSE
RECORD_CREDIT
RECORD_PAYMENT
CHECK_CREDIT
CHECK_SALES
CHECK_EXPENSES
CHECK_PROFIT
GENERATE_SUMMARY
CHECK_STOCK
```

### Entity Extraction

Relevant entities may include:

```text
Customer
Amount
Product
Date
Quantity
Transaction Type
Payment Status
Expense Category
```

Example:

```text
Input:
"Ram le 500 ko udharo lagyo."

Intent:
RECORD_CREDIT

Entities:
Customer = Ram
Amount = 500
Currency = NPR
```

---

# 🏗️ System Architecture

The proposed architecture follows a modular design:

```text
                    ┌──────────────────────┐
                    │        User          │
                    │   Voice / Text Input │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Speech-to-Text     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    NLP Processing    │
                    │ Intent + Entities    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Transaction Service  │
                    │ Validation & Logic    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Database        │
                    │ Business Records     │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ Analytics &     │       │ Natural Language│
        │ Business Reports│       │ Query Engine    │
        └─────────────────┘       └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ User Response   │
                                  └─────────────────┘
```

---

# 🗃️ Core Data Model

The system is expected to maintain structured records around entities such as:

```text
User
 │
 ├── Customers
 │      └── Credit Transactions
 │
 ├── Products
 │      └── Sales Transactions
 │
 ├── Expenses
 │
 └── Business Transactions
```

A transaction may contain:

```text
Transaction
├── ID
├── User ID
├── Transaction Type
├── Amount
├── Customer
├── Product
├── Quantity
├── Date
├── Payment Status
├── Category
└── Notes
```

The final data model may evolve during implementation.

---

# 🛠️ Technology Stack

The technology stack will evolve as the system is implemented.

### Backend

* Python
* Django
* Django REST Framework
* RESTful APIs

### AI / NLP

* Python
* Natural Language Processing
* Speech-to-Text
* Intent Classification
* Named Entity Recognition / Entity Extraction
* Machine Learning / Large Language Models where appropriate

### Database

* PostgreSQL

### Frontend

* HTML
* CSS
* JavaScript
* Web-based user interface

### Development

* Git
* GitHub
* VS Code
* Docker

### Testing

* Pytest
* Django Testing Framework
* API Testing
* NLP Evaluation
* End-to-End Testing

> Technologies may be replaced or extended as the project progresses.

---

# 📁 Project Structure

The repository is expected to follow a modular structure similar to:

```text
MeroHisab/
│
├── backend/
│   ├── apps/
│   ├── api/
│   ├── models/
│   ├── serializers/
│   ├── services/
│   └── urls/
│
├── ai/
│   ├── speech/
│   ├── nlp/
│   ├── intent/
│   └── entity_extraction/
│
├── frontend/
│
├── tests/
│
├── docs/
│
├── .env.example
├── .gitignore
├── requirements.txt
├── manage.py
└── README.md
```

> The structure will be updated as implementation progresses.

---

# ⚙️ Installation

## Prerequisites

Before running the project, make sure you have:

* Python 3.x
* Git
* PostgreSQL
* pip
* Virtual environment support

## Clone the Repository

```bash
git clone https://github.com/MeroHisab/MeroHisab.git
cd MeroHisab
```

## Create a Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Configure Environment Variables

Create a `.env` file based on `.env.example` and configure the required environment variables.

## Run Database Migrations

```bash
python manage.py migrate
```

## Start the Development Server

```bash
python manage.py runserver
```

The application should then be available at:

```text
http://127.0.0.1:8000/
```

> Installation instructions will be updated as the final architecture is established.

---

# 🔌 API Overview

The backend is designed around RESTful APIs.

Potential endpoints include:

| Method | Endpoint                      | Purpose                  |
| ------ | ----------------------------- | ------------------------ |
| POST   | `/api/transactions/`          | Create a transaction     |
| GET    | `/api/transactions/`          | Retrieve transactions    |
| GET    | `/api/customers/`             | Retrieve customers       |
| GET    | `/api/customers/{id}/credit/` | View customer credit     |
| GET    | `/api/reports/monthly/`       | Generate monthly summary |
| POST   | `/api/voice/process/`         | Process voice input      |
| POST   | `/api/nlp/parse/`             | Process natural language |

> API endpoints are subject to change during development.

---

# 🧪 Testing & Evaluation

Testing will be performed at multiple levels.

### Unit Testing

Individual components such as:

* Transaction calculations
* Credit calculations
* Business logic
* NLP functions

### API Testing

Testing:

* Request validation
* Authentication
* API responses
* Error handling

### NLP Evaluation

The NLP pipeline will be evaluated based on factors such as:

* Intent classification accuracy
* Entity extraction accuracy
* Handling of different sentence structures
* Numerical information extraction
* Nepali language understanding

### End-to-End Testing

A complete workflow will be tested:

```text
Voice Input
    ↓
Speech Recognition
    ↓
NLP Processing
    ↓
Transaction Extraction
    ↓
Validation
    ↓
Database
    ↓
Business Summary
```

---

# 🔐 Security & Privacy

MeroHisab may process sensitive business and customer information.

Security considerations include:

* User authentication
* Authorization and access control
* User-specific data isolation
* Secure API communication
* Input validation
* Environment-based secret management
* Secure database configuration
* Protection of customer information

The system will avoid exposing one user's business records to another user.

---

# 📊 Research & User Validation

MeroHisab is being developed with a user-centered approach.

Research will focus on understanding how small retailers currently manage:

* Sales
* Expenses
* Customer credit
* Payments
* Inventory
* Profit and loss
* Business summaries

User research and feedback will be used to validate assumptions and prioritize features.

The project will evaluate whether a **voice-first interaction model** can reduce the effort required to maintain everyday business records.

---

# 🌍 Target Users

The primary target users are:

* Small grocery and convenience stores
* Local retailers
* Family-run businesses
* Small shops with informal bookkeeping practices
* Retailers who prefer speaking over extensive typing

The system is initially designed with the context of **small businesses in Nepal** in mind, while the underlying architecture can be extended to other markets.

---

# 🗺️ Roadmap

## Phase 1 — Research

* [x] Define initial problem
* [x] Identify target users
* [ ] Conduct user research
* [ ] Analyze user requirements
* [ ] Finalize functional requirements

## Phase 2 — Core Backend

* [ ] User authentication
* [ ] Database design
* [ ] Transaction model
* [ ] Customer model
* [ ] Credit management
* [ ] Sales management
* [ ] Expense management
* [ ] REST APIs

## Phase 3 — AI & NLP

* [ ] Speech-to-text integration
* [ ] Text preprocessing
* [ ] Intent classification
* [ ] Entity extraction
* [ ] Transaction parsing
* [ ] Natural language query processing

## Phase 4 — Business Intelligence

* [ ] Daily summaries
* [ ] Monthly summaries
* [ ] Sales analytics
* [ ] Expense analytics
* [ ] Profit estimation
* [ ] Credit analytics

## Phase 5 — User Interface

* [ ] Dashboard
* [ ] Voice interaction
* [ ] Transaction history
* [ ] Customer management
* [ ] Reports
* [ ] Analytics

## Phase 6 — Testing & Deployment

* [ ] Unit testing
* [ ] API testing
* [ ] NLP evaluation
* [ ] Integration testing
* [ ] Security testing
* [ ] Deployment
* [ ] User evaluation

---

# 📸 Screenshots & Demonstrations

Screenshots, system demonstrations, architecture diagrams, and sample interactions will be added as the implementation progresses.

Planned documentation includes:

* Dashboard
* Voice input interface
* Transaction history
* Customer credit page
* Monthly business report
* NLP processing examples
* System architecture
* API documentation

---

# 🚀 Project Status

**Status: In Development**

MeroHisab is currently under active development.

The architecture, feature set, technology stack, and implementation details may evolve based on:

* User research
* Technical feasibility
* NLP performance
* Testing results
* User feedback

---

# 🔮 Future Possibilities

Future versions may explore:

* Fully conversational business assistance
* Offline-first transaction recording
* Mobile application
* Multi-language support
* Advanced inventory management
* Automated business insights
* Sales forecasting
* Personalized recommendations
* Voice-based report generation
* Multi-user business accounts
* Cloud synchronization
* Advanced analytics
* Integration with digital payment systems

---

# 👥 Team

## MeroHisab Team

* **Smriti Basnet**
* **Priyanka**

---

# 🎓 Academic Context

MeroHisab is being developed as a **university project** exploring the practical application of:

* Artificial Intelligence
* Natural Language Processing
* Speech Technology
* Backend Engineering
* Database Systems
* Business Analytics
* Human-Centered Software Design

The project combines software engineering and AI to address a practical problem faced by small businesses.

---

# 📄 License

The licensing terms for this project will be finalized as development progresses.

---

# ⭐ Vision

> **To make business record keeping as simple as having a conversation.**

MeroHisab aims to reduce the gap between small businesses and digital technology by creating a business management experience that is **simple, voice-driven, intelligent, and accessible**.

---


