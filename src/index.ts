#!/usr/bin / env node

import inquirer from "inquirer";
import {
    createNewTask,
    getCurrentUser,
    getEpicSummary,
} from "./services/jiraApis";
import chalk from "chalk";
import { textInBox } from "./utils/textInBox";
import { fetchSheetData } from "./services/googleSheets";
import { convertHoursToStoryPoint } from "./utils/convertHoursToStoryPoint";

async function main() {
    // Step: 1
    console.log("\nHello There!");
    console.log("Getting Your Jira Account Details...\n");

    const userDetails = await getCurrentUser();

    if (!userDetails) {
        console.log("Oops! Couldn't fetch your Jira account details!");
        return;
    }

    const nameAndEmail = textInBox({
        content: `${chalk.bold(userDetails.displayName)}\n${chalk.gray(userDetails.emailAddress)}`,
        borderColor: "cyan",
    });

    // Step: 2
    const { is_correct_user } = await inquirer.prompt([
        {
            type: "list",
            name: "is_correct_user",
            message: `Is this your Jira account?\n${nameAndEmail}\n`,
            choices: ["Yes", "No"],
        },
    ]);

    if (is_correct_user === "No") {
        console.log("Closing Session!");
        return;
    }

    // Step: 3
    const { epic_link } = await inquirer.prompt([
        {
            type: "input",
            name: "epic_link",
            message: "Paste the target epic ticket link:",
        },
    ]);

    const epicDetails = await getEpicSummary({ epic: epic_link });
    if (!epicDetails) {
        console.log(
            "Oops! Couldn't fetch epic ticket details! Are you sure is it correct link?"
        );
        return;
    }
    const { epicKey, epicSummary } = epicDetails;

    const epicSummaryBox = textInBox({
        content: `${chalk.bold(epicSummary)}`,
        borderColor: "blue",
    });

    console.log("");

    // Step: 4
    const { is_correct_epic } = await inquirer.prompt([
        {
            type: "list",
            name: "is_correct_epic",
            message: `Is this the correct target epic ticket?\n${epicSummaryBox}\n`,
            choices: ["Yes", "No"],
        },
    ]);
    if (is_correct_epic === "No") {
        console.log("Closing Session!");
        return;
    }

    // Step: 5
    const { sheet_link } = await inquirer.prompt([
        {
            type: "input",
            name: "sheet_link",
            message: "Paste the target public access google sheet link:",
        },
    ]);

    console.log("Fetching data from the sheet...");

    const tasksAndHours = await fetchSheetData({
        sheetURL: sheet_link,
    });

    if (!tasksAndHours) {
        console.log(
            `\nOops! Couldn't fetch sheet's data! Make your sheet is shared ${chalk.bgBlackBright(" Anyone with the link ")} and have data in correct format ${chalk.bgBlackBright(" task, hours ")}`
        );
        return;
    }

    console.log("\nFetched data successfully! ✅");
    console.table(tasksAndHours);
    console.log("\n");

    // Step: 6
    const { is_want_create_tasks } = await inquirer.prompt([
        {
            type: "list",
            name: "is_want_create_tasks",
            message: `Do you want to create jira tasks under ${chalk.bgBlackBright(` ${epicSummary} `)} from above table?\n`,
            choices: ["Yes", "No"],
        },
    ]);
    if (is_want_create_tasks === "No") {
        console.log("Closing Session!");
        return;
    }
    console.log("\n");

    const { is_want_create_tasks_confirmed } = await inquirer.prompt([
        {
            type: "list",
            name: "is_want_create_tasks_confirmed",
            message: `Final Confirmation!\n`,
            choices: ["Yes", "No"],
        },
    ]);
    if (is_want_create_tasks_confirmed === "No") {
        console.log("Closing Session!");
        return;
    }

    console.log("Creating task. Please wait and don't close the process...");

    const tasksCreationPromised = tasksAndHours.map(({ task, hours }) => {
        return createNewTask({
            accountId: userDetails.accountId,
            epicKey,
            storyPoint: convertHoursToStoryPoint(hours),
            summary: task,
        });
    });

    const results = await Promise.allSettled(tasksCreationPromised);

    const successCount = results.reduce((acc, curr) => {
        if (curr.status === "fulfilled" && curr.value) {
            return acc + 1;
        }
        return acc;
    }, 0);
    const failedCount = results.reduce((acc, curr) => {
        if (curr.status === "rejected" || !curr.value) {
            return acc + 1;
        }
        return acc;
    }, 0);

    console.log(
        `\n Process complete with ${chalk.bgBlackBright(` ${successCount}/${tasksAndHours.length} `)} tasks created and ${chalk.bgBlackBright(` ${failedCount}/${tasksAndHours.length} `)} failed!`
    );
}

main();
