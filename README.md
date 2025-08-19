# my\_jira\_buddy

A personal CLI tool to quickly create Jira **Task** issues under a parent **Epic**, with summary, story points, original estimated time and assigned developer.

🎬 **Demo:**

https://github.com/user-attachments/assets/e3a2693c-d1a3-4a4e-a574-597fc54f6d67

---

## 🚀 Features

* Create Jira issues of type **Task** under a parent Epic
* Set **Summary**, **Story Points**, and **Assignee**
* Automate repetitive Jira issue creation

---

## ⚙️ Installation

```bash
git clone https://github.com/kevalmiistry/my_jira_buddy.git
cd my_jira_buddy
npm install
npm run build
npm link
```

---

## ⚙️ Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Open `.env` and set your Jira credentials and API variables.

---

## 🛠️ Usage

After linking, run the CLI globally:

```bash
my_jira_buddy
```

Follow the prompts to create Jira issues under your Epic.
