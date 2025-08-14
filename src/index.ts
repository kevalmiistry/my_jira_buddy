#!/usr/bin/env node

import inquirer from "inquirer";
import { getCurrentUser, getEpicSummary } from "./services/jiraApis";
import chalk from "chalk";
import { textInBox } from "./utils/textInBox";

async function main() {
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

    const { epic_link } = await inquirer.prompt([
        {
            type: "input",
            name: "epic_link",
            message: "Paste the target epic ticket link:",
        },
    ]);

    const epicSummary = await getEpicSummary({ epic: epic_link });

    if (!epicSummary) {
        console.log(
            "Oops! Couldn't fetch epic ticket details! Are you sure is it correct link?"
        );
        return;
    }

    const epicSummaryBox = textInBox({
        content: `${chalk.bold(epicSummary)}`,
        borderColor: "blue",
    });

    console.log("");

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
}

main();
