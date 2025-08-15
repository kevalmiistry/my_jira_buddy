#!/usr/bin/env node

import inquirer from "inquirer";
import { createNewTask, getCurrentUser, getEpicSummary } from "./services/jira";
import chalk from "chalk";
import { textInBox } from "./utils/textInBox";
import { fetchSheetData } from "./services/googleSheets";
import { convertHoursToStoryPoint } from "./utils/convertHoursToStoryPoint";
import ora from "ora";

async function main() {
    try {
        // Step: 1
        console.log(chalk.green(chalk.bold("\nHello There!\n")));

        const accountSpinner = ora(
            "Fetching your Jira account details...\n"
        ).start();

        const userDetails = await getCurrentUser();

        if (!userDetails) {
            accountSpinner.fail(
                "Oops! Couldn't fetch your Jira account details!"
            );
            return;
        }
        accountSpinner.succeed(
            "Successfully fetched your Jira account details!"
        );

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

        console.log("");

        // Step: 3
        const { epic_link } = await inquirer.prompt([
            {
                type: "input",
                name: "epic_link",
                message: "Paste the target epic ticket link:",
            },
        ]);

        const epicSpinner = ora("Fetching epic ticket details...\n").start();

        const epicDetails = await getEpicSummary({ epic: epic_link });
        if (!epicDetails) {
            epicSpinner.fail(
                "Oops! Couldn't fetch epic ticket details! Are you sure its correct link?"
            );
            return;
        }
        epicSpinner.succeed("Successfully fetched epic ticket details!");

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
        console.log("");

        // Step: 5
        const { sheet_link } = await inquirer.prompt([
            {
                type: "input",
                name: "sheet_link",
                message: "Paste the target public access google sheet link:",
            },
        ]);

        const sheetSpinner = ora("Fetching data from the sheet...").start();

        const tasksAndHours = await fetchSheetData({
            sheetURL: sheet_link,
        });

        if (!tasksAndHours) {
            sheetSpinner.fail(
                `Oops! Couldn't fetch sheet's data! Make sure your sheet is shared ${chalk.bgBlackBright(
                    " Anyone with the link "
                )} and has correct format ${chalk.bgBlackBright(" task, hours ")}`
            );
            return;
        }

        sheetSpinner.succeed("Fetched data successfully! ✅");
        console.table(tasksAndHours);
        console.log("");

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
        console.log("");

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

        console.log("\n");
        const createTasksSpinner = ora(
            "Creating tasks, Please wait and don't cancel the process..."
        ).start();

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

        console.log("\n");

        createTasksSpinner.succeed(
            `Process completed with ${chalk.bgBlackBright(` ${successCount}/${tasksAndHours.length} `)} tasks created and ${chalk.bgBlackBright(` ${failedCount}/${tasksAndHours.length} `)} failed!\n\n ${chalk.bgMagenta(" HAPPY CODING! ")} \n`
        );
    } catch (err: unknown) {
        if (err && typeof err === "object" && "name" in err) {
            const name = String((err as { name?: string }).name);

            if (name === "ExitPromptError") {
                console.log("\nPrompt canceled by user.");
                process.exit(0);
            }
        }

        if (err && typeof err === "object" && "isTtyError" in err) {
            console.error(
                "Prompt couldn’t be rendered in the current environment."
            );
            process.exit(1);
        }

        console.error(err);
        process.exit(1);
    }
}

main();
