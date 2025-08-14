import boxen, { Options } from "boxen";

type BorderColor = NonNullable<Options["borderColor"]>;

export const textInBox = ({
    content,
    borderColor,
}: {
    content: string;
    borderColor: BorderColor;
}) => {
    return boxen(content, {
        padding: {
            left: 1,
            right: 1,
        },
        borderStyle: "round",
        borderColor,
        align: "center",
    });
};
