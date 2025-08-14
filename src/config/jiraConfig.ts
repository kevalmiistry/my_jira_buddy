import dotenv from "dotenv";
dotenv.config();

export const jiraConfig = {
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    url: "https://culturex-influenzer.atlassian.net",
};
