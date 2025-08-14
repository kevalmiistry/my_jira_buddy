import { parse } from "csv-parse/sync";
import z from "zod";

const schema = z.array(
    z.object({
        task: z.string(),
        hours: z.string().transform((val, ctx) => {
            const num = Number(val);
            if (Number.isNaN(num)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Hours must be a valid number",
                });
                return z.NEVER; // stops transformation
            }
            return num;
        }),
    })
);

export type TasksAndHours = z.infer<typeof schema>;

interface FetchSheetData {
    sheetURL: string;
}

export const fetchSheetData = async ({
    sheetURL,
}: FetchSheetData): Promise<TasksAndHours | null> => {
    try {
        function extractIdAndGid(url: string) {
            const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
            const gid = url.match(/[?&]gid=(\d+)/)?.[1] ?? "0"; // default first tab
            if (!id) throw new Error("Invalid Google Sheet URL");
            return { id, gid };
        }

        function csvExportUrl(id: string, gid: string) {
            return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
        }

        const { id, gid } = extractIdAndGid(sheetURL);
        const res = await fetch(csvExportUrl(id, gid));
        const csv = await res.text();

        const rows = parse(csv, { columns: true, skip_empty_lines: true });

        const parsedTasksAndHours = schema.parse(rows);

        return parsedTasksAndHours;
    } catch (error) {
        return null;
    }
};
