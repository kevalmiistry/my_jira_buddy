import axios from "axios";
import { JiraUser } from "../types";
import { jiraConfig } from "../config/jiraConfig";
import { extractEpicKey } from "../utils/extractEpicKey";

const authHeader = {
    Authorization: `Basic ${Buffer.from(
        `${jiraConfig.email}:${jiraConfig.apiToken}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
};

export const getCurrentUser = async (): Promise<JiraUser | null> => {
    try {
        const { data: currentJiraUser } = await axios.get<JiraUser>(
            `${jiraConfig.url}/rest/api/3/myself`,
            { headers: authHeader }
        );

        return currentJiraUser;
    } catch (err: any) {
        console.error(
            "Error at: getCurrentUserId()",
            err.response?.data || err.message
        );
        return null;
    }
};

interface GetEpicSummary {
    epic: string;
}

export const getEpicSummary = async ({
    epic,
}: GetEpicSummary): Promise<{
    epicKey: string;
    epicSummary: string;
} | null> => {
    try {
        const epicKey = extractEpicKey(epic);

        if (!epicKey) {
            throw Error("No valid epic issue key found!");
        }

        const { data } = await axios.get(
            `${jiraConfig.url}/rest/api/3/issue/${epicKey}`,
            { headers: authHeader }
        );

        const epicSummary = data?.fields?.summary || null;

        return { epicKey, epicSummary };
    } catch (error) {
        return null;
    }
};

interface CreateNewTask {
    summary: string;
    epicKey: string;
    storyPoint: number;
    accountId: string;
}

export const createNewTask = async ({
    accountId,
    epicKey,
    storyPoint,
    summary,
}: CreateNewTask): Promise<boolean> => {
    try {
        const body = {
            fields: {
                project: { key: "IN" },
                summary,
                issuetype: { name: "Task" },
                customfield_10014: epicKey, // Epic Link (e.g.: IN-123)
                customfield_10034: storyPoint, // Story Points
                customfield_10498: [
                    { id: accountId }, // Assigned Developer (accountId)
                ],
            },
        };

        await axios.post(`${jiraConfig.url}/rest/api/3/issue`, body, {
            headers: authHeader,
        });

        return true;
    } catch (error) {
        return false;
    }
};
