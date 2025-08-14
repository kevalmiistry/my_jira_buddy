import axios from "axios";
import { jiraConfig } from "./config/jiraConfig";
import { JiraUser } from "./types";
import express from "express";
import type { Request, Response } from "express";
import { extractEpicKey } from "./utils/extractEpicKey";

const app = express();

const authHeader = {
    Authorization: `Basic ${Buffer.from(
        `${jiraConfig.email}:${jiraConfig.apiToken}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
};

const getCurrentUserId = async (): Promise<string | null> => {
    try {
        const { data: currentJiraUser } = await axios.get<JiraUser>(
            `${jiraConfig.url}/rest/api/3/myself`,
            { headers: authHeader }
        );

        return currentJiraUser.accountId;
    } catch (err: any) {
        console.error(
            "Error at: getCurrentUserId()",
            err.response?.data || err.message
        );
        return null;
    }
};

const createNewTask = async (_: Request, res: Response) => {
    try {
        const accountId = await getCurrentUserId();

        if (!accountId) {
            throw Error("Can't get accountId");
        }

        const body = {
            fields: {
                project: { key: "IN" },
                summary: "My automated task 2",
                issuetype: { name: "Task" },
                customfield_10014: "IN-582", // Epic Link (you already identified)
                customfield_10034: 1.25, // Story Points
                customfield_10498: [
                    { id: accountId }, // Assigned Developer (accountId)
                ],
            },
        };

        const { data } = await axios.post(
            `${jiraConfig.url}/rest/api/3/issue`,
            body,
            { headers: authHeader }
        );

        res.status(200).json(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            res.status(400).json(error.response?.data);
        }
    }
};

interface GetEpicDetailsQuery {
    epic: string;
}

const getEpicSummary = async (
    req: Request<any, any, any, GetEpicDetailsQuery>,
    res: Response
) => {
    try {
        const { epic } = req.query;

        const epicKey = extractEpicKey(epic);

        if (!epicKey) {
            throw Error("No valid epic issue key found!");
        }

        const { data } = await axios.get(
            `${jiraConfig.url}/rest/api/3/issue/${epicKey}`,
            { headers: authHeader }
        );

        const epicSummary = data?.fields?.summary || "-";

        res.status(200).json({ epicSummary });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            res.status(400).json(error.response?.data);
        }
    }
};

app.post("/api/create", createNewTask);
app.get("/api/epic", getEpicSummary);

app.listen(1234, () => {
    console.log("Server is running on port: 1234");
});
