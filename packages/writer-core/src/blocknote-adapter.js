import { createBlock, createTextNode, nowIso } from "./document.js";
import { getBlockPlainText } from "./document.js";
const supportedEditorBlockTypes = new Set([
    "paragraph",
    "heading",
    "bulletListItem",
    "numberedListItem",
    "checkListItem",
    "codeBlock",
    "table"
]);
function marksToStyles(marks) {
    return marks.reduce((styles, mark) => {
        if (mark.type === "highlight") {
            styles.textColor =
                typeof mark.attrs?.color === "string" ? mark.attrs.color : "#ca8a04";
            return styles;
        }
        styles[mark.type] = true;
        return styles;
    }, {});
}
function stylesToMarks(styles) {
    if (!styles) {
        return [];
    }
    return Object.entries(styles).flatMap(([key, value]) => {
        if (!value) {
            return [];
        }
        if (key === "textColor" && typeof value === "string") {
            return [{ type: "highlight", attrs: { color: value } }];
        }
        if (key === "bold" ||
            key === "italic" ||
            key === "underline" ||
            key === "strike") {
            return [{ type: key }];
        }
        return [];
    });
}
function writerTableToBlockNoteContent(rows) {
    return {
        type: "tableContent",
        rows: rows.map((row) => ({
            cells: row.cells.map((cell) => cell.content.map((node) => ({
                type: "text",
                text: node.text,
                styles: marksToStyles(node.marks)
            })))
        }))
    };
}
export function canonicalBlockToBlockNoteBlock(block) {
    const editorType = supportedEditorBlockTypes.has(block.type)
        ? block.type
        : "paragraph";
    if (block.type === "table" && block.tableContent) {
        return {
            id: block.id,
            type: "table",
            content: writerTableToBlockNoteContent(block.tableContent),
            children: []
        };
    }
    return {
        id: block.id,
        type: editorType,
        props: {
            textAlignment: block.props.textAlign ?? "left",
            level: block.props.level,
            ...(block.props.checked !== undefined && { checked: block.props.checked }),
            ...(block.props.language !== undefined && { language: block.props.language })
        },
        content: getBlockPlainText(block),
        children: block.children.map(canonicalBlockToBlockNoteBlock)
    };
}
export function canonicalDocumentToBlockNote(document) {
    return document.blocks.map(canonicalBlockToBlockNoteBlock);
}
function isTableContent(content) {
    return (typeof content === "object" &&
        content !== null &&
        content.type === "tableContent");
}
function blockNoteTableToWriterRows(tableContent) {
    return tableContent.rows.map((row) => ({
        cells: row.cells.map((cell) => ({
            content: cell.map((node) => createTextNode(node.text, stylesToMarks(node.styles)))
        }))
    }));
}
const knownBlockTypes = new Set([
    "paragraph",
    "heading",
    "bulletListItem",
    "numberedListItem",
    "quote",
    "table",
    "checkListItem",
    "codeBlock"
]);
export function blockNoteBlockToCanonicalBlock(block) {
    // Handle table blocks
    if (block.type === "table" && isTableContent(block.content)) {
        return {
            id: block.id ?? createBlock().id,
            type: "table",
            props: {},
            content: [],
            tableContent: blockNoteTableToWriterRows(block.content),
            children: []
        };
    }
    const textAlignment = block.props?.textAlignment;
    const level = block.props?.level;
    const checked = block.props?.checked;
    const language = block.props?.language;
    const content = typeof block.content === "string"
        ? [createTextNode(block.content)]
        : Array.isArray(block.content)
            ? block.content.map((node) => createTextNode(node.text, stylesToMarks(node.styles)))
            : [createTextNode("")];
    const canonicalType = knownBlockTypes.has(block.type)
        ? block.type
        : "paragraph";
    return {
        id: block.id ?? createBlock().id,
        type: canonicalType,
        props: {
            textAlign: textAlignment === "center" || textAlignment === "right"
                ? textAlignment
                : "left",
            level: level === 1 || level === 2 || level === 3
                ? level
                : undefined,
            ...(typeof checked === "boolean" && { checked }),
            ...(typeof language === "string" && { language })
        },
        content,
        children: block.children?.map(blockNoteBlockToCanonicalBlock) ?? []
    };
}
export function blockNoteDocumentToCanonical(base, blocks) {
    return {
        ...base,
        blocks: blocks.map(blockNoteBlockToCanonicalBlock),
        metadata: {
            ...base.metadata,
            updatedAt: nowIso()
        }
    };
}
//# sourceMappingURL=blocknote-adapter.js.map