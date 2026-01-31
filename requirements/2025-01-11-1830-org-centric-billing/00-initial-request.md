# Initial Request - Organization-Centric Billing Model

**Date:** 2025-01-11  
**Time:** 18:30  
**Requester:** Gabriel

## Original Request (Slovak)

Ahoj,

pri implementácii Stripe billing som narazil na dôležitú otázku ohľadom nášho billing modelu, ktorú potrebujem vyjasniť:

Sme USER-CENTRIC alebo ORGANIZATION-CENTRIC billing model?

Náš aktuálny pricing table vyzerá ako USER-CENTRIC, ale implementácia smeruje k ORGANIZATION-CENTRIC. Tu je rozdiel:

---

🔹 USER-CENTRIC Model (ako Vercel, Netlify, GitHub personal)

- Ako funguje: User kupuje plán → dostane limity (počet organizácií, projektov)
- Billing: Na USER účte
- Príklad:
  - Ja som Gabriel, kupujem START plán
  - Môžem vytvoriť až 5 organizácií
  - Môžem mať unlimited projekty
  - Platím raz mesačne za môj účet

Náš pricing to naznačuje:

- Free: 1 organizácia, 1 projekt
- Start: 5 organizácií, unlimited projektov
- Business: Unlimited organizácií

---

🔹 ORGANIZATION-CENTRIC Model (ako Slack, Linear, Notion)

- Ako funguje: Organizácia kupuje plán → platí per seat/user
- Billing: Na ORGANIZATION účte
- Príklad:
  - Blogic AI kupuje Business plán
  - Platí za každého člena tímu
  - Každý user môže byť v multiple organizáciách (každá platí zvlášť)

---

❓ Problém ktorý riešim:

Náš pricing table ukazuje "Organizations: 1/5/Unlimited" - to je typické pre USER-CENTRIC (koľko organizácií môže user vytvoriť).

Ale ak to má byť ORGANIZATION-CENTRIC, tak:

- Prečo by organizácia platila za to koľko organizácií môže vytvoriť?
- Nedáva to zmysel - organizácia je jedna entita

🎯 Potrebujem vedieť:

1. Kto vlastní subscription? User alebo Organization?
2. Kto platí? Jednotlivec za svoj účet alebo firma za organizáciu?
3. Ak user patrí do 3 organizácií, koľko subscriptions existuje? (1 user subscription alebo 3 org subscriptions?)

Podľa odpovede upravím celú implementáciu billing flow.

Ďakujem!

**Final instruction:** zmen teda sucasny client centric na org centric

## Translation & Summary

**Request:** Change the current user-centric billing model to organization-centric.

**Key Points:**

- Current pricing table suggests user-centric (users buy plans with organization limits)
- Implementation is moving toward organization-centric (organizations buy plans, pay per seat)
- Need to clarify: Who owns subscriptions? Who pays? How many subscriptions exist per user?
- Need to restructure entire billing flow from user-based to organization-based

**Goal:** Transform billing from user purchasing plans with org limits → organizations purchasing plans with per-seat pricing
