Below is your **full, clean, CEO-ready, Engineering-ready PRD** for **BazaarBudget** — structured, precise, production-grade, and aligned with the massive build you described.

This PRD is written exactly how a **top PM at CRED / Razorpay / Slice** would write it for a 50-member engineering team on Day 1 of execution.

---

# 📘 **BAZAARBUDGET – PRODUCT REQUIREMENTS DOCUMENT (PRD)**

**Version:** 1.0
**Date:** 29 Nov 2025
**Owner:** Nitesh Jha (Product Manager)
**Reviewed by:** Engineering, Design, Finance, Compliance, Data
**Status:** Approved — Sprint 0 Complete

---

# 1. 🎯 **Product Vision**

Build **India’s #1 Personal Finance OS** that automatically tracks every rupee a user spends, across **UPI, bank accounts, cash, cards, and offline transactions**—and helps them manage their **family finances**, not just personal finance.

> **Goal:** “Every Indian household should know *Lena-Dena* in 1 tap.”

---

# 2. 🧭 **Core Objectives**

### 1. **Accurate 360° Money Tracking**

* Auto-capture from bank (AA), SMS, UPI, Wallets
* Manual entries with voice, text, camera
* Family expenses consolidated

### 2. **Family-Focused Money Management**

* Not just one user
* Household model with spouses, parents, siblings
* Shared pockets & visibility

### 3. **Zero-Learning UI**

* 90% Hindi-first UX
* “Bhai ₹450 petrol” → auto entry
* Glassmorphism + Cinematic onboarding

### 4. **Financial Discipline Engine**

* Smart nudges
* Alerts
* Cash-flow predictions
* Reminders

---

# 3. 🧍‍♂️🧍‍♀️ **Target Users**

### **Primary Users**

* Indian families aged 22–50
* Tier 1, 2, 3
* Monthly expenses 15–80k
* Want simplicity + automation

### **Secondary Users**

* Digital-first spenders
* Shop owners managing home & business
* Couples tracking shared expenses

---

# 4. ⚙️ **Key Modules**

1. **Onboarding & Auth (Mobile)**
2. **Accounts Aggregator (Setu AA)**
3. **Lena-Dena Transaction Engine**
4. **Pockets (Smart budgets)**
5. **We Tab (Family finance model)**
6. **Cashbook & Voice entry**
7. **Tax Optimization Engine**
8. **Notifications & Insights**
9. **Data Infra (Postgres + Prisma)**
10. **Admin Panel (Web)**

---

# 5. 🚀 **Full Feature Breakdown (MVP + V1)**

---

## 5.1 🔐 **A. Authentication**

**Owner:** @priya-mobile / @vikas-backend
**Status:** Live

### Requirements

* Firebase Auth (India)
* Phone login with OTP
* Auto-read OTP
* Check user existence in DB
* Create default user profile

---

## 5.2 🎬 **B. Onboarding Flow (6 screens)**

**Owner:** @neha-design / Your current task (Screen 2)

### Screens

1. Phone login + OTP
2. **Family Size** → “Aapki family mein kitne log hain?” (Your task)
3. Income range
4. Main spending method?
5. Biggest financial issue?
6. Enable notifications + AA consent CTA

### Requirements

* Tamagui + Glassmorphism
* Lottie animations
* Buttons = Glass Buttons
* All screens < 2 seconds load
* Hindi-first copy

---

## 5.3 🔗 **C. Accounts Aggregator – Setu AA**

**Owner:** @arjun-fintech
**Status:** Sandbox live

### Requirements

* Consent flow (Setu UI Kit)
* Fetch bank accounts
* Fetch last 180-day transactions
* Auto-categorization
* Auto-sync every 24 hours

---

## 5.4 💳 **D. Lena-Dena (Transaction Engine)**

**Owner:** @rohan-backend
**Start:** In 2 hours

### Requirements

* All transactions normalized
* Detect: UPI, POS, ATM, Wallets
* SMS scraper fallback
* Cash transactions manually
* Intelligent category mapping
* Daily summary
* Error handling for duplicates

---

## 5.5 🧺 **E. Pockets (Budget Engine)**

**Owner:** @sameer-ml
**Start:** 9:40 AM today

### Requirements

* Auto pockets for Food, Petrol, Family, EMI
* Smart limits suggestion
* Overspend warnings
* Dynamic pocket resize suggestion
* Glass cards (Kesari + Charcoal palette)

---

## 5.6 👫 **F. We Tab (Family Mode)**

**Owner:** @neha-design / @vikas-backend
**Start:** Sprint Week 2

### Requirements

* Add spouse
* Add sibling/parent
* Shared pockets
* Export shared transactions
* Role-based visibility

---

## 5.7 🗣️ **G. Voice Entry (“Bhai 450 petrol”)**

**Owner:** @rahul-cto
**Status:** Working in dev

### Requirements

* Hindi voice-to-text
* Pattern extraction
* Auto category suggestion
* Confirmation modal

---

## 5.8 💬 **H. Notifications + Alerts**

**Owner:** @priya-mobile

* Overspend warnings
* Cash-flow prediction
* Daily morning expense brief
* Upcoming EMI alert
* “Low bank balance”

---

## 5.9 🧾 **I. Tax Engine**

**Owner:** @ca-shweta
**Start:** Day 3

### Requirements

* Auto-check financial year
* 80C, 80D, 80CCD projections
* Smart suggestions
* Monthly tax-health score

---

## 5.10 🛠️ **J. Admin Panel**

**Owner:** @rahul-cto
**Start:** Sprint 3

### Requirements

* User list
* Expense trends
* Flags & risk alerts
* Crash logs
* SMS-parser monitoring

---

# 6. 📂 **Tech Architecture Overview**

### **Frontend**

* Expo (React Native)
* Tamagui (UI)
* Lottie animation
* Expo-Speech + Expo-SMS
* Expo-Notifications

### **Backend**

* NestJS
* Prisma ORM
* PostgreSQL
* Firebase
* Setu AA APIs
* Railway deployment
* GitHub Actions CI/CD

### **Infra**

* Monorepo with Turborepo
* Shared UI components
* Shared types package
* Protected main branch
* Preview branches auto-deployed

---

# 7. 📊 **KPIs (Executive Level)**

### **North Star Metric**

**Daily Active Households (DAH)** — *not just DAU*

### Secondary KPIs

* % of users connecting bank via AA
* Avg no. of transactions auto-captured
* Pocket setup rate
* Family mode adoption
* 7-day retention (aim: 45%)
* 30-day retention (aim: 28%)
* Net monthly inflow/outflow accuracy

---

# 8. 🗓️ **Release Plan**

### 📦 **Alpha 0.1 — TODAY (29 Nov 2025)**

* Onboarding
* Pockets
* Basic transactions
* Voice entry / SMS parsing

### 📦 **Beta 1.0 — 7 Dec 2025**

* AA live
* Cashbook
* Family mode
* Insights
* 80% bugs fixed

### ⭐ **Final Launch — 16 March 2026**

* Marketing
* Compliance
* App Store + Play Store

---

# 9. 🧪 **Testing Requirements**

### Mobile QA

* Android 8 to 14
* iOS 14 to 18
* Poor network testing
* SMS permissions+AA permissions
* Offline mode caching

### Security

* Token encryption
* Financial data masking
* Role-based access

---

# 10. 📄 **Appendix: UI/UX Rules**

* Hindi-first
* 4px grid
* Soft glass blur 24
* Charcoal background
* Kesari highlight
* Spacing: 24/16/12
* Motion: 240ms ease-out

---


