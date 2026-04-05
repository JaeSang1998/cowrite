import { createDocumentVersion, createId, deepClone, findBlockById, getBlockPlainText, mapBlocks, nowIso, replaceBlockPlainText } from "./document.js";
function assertValidRange(text, target) {
    if (target.start < 0 || target.end < target.start || target.end > text.length) {
        throw new Error("Invalid patch range for target block.");
    }
}
function shiftAnnotation(annotation, target, replacementLength, originalLength, nextText) {
    if (annotation.anchor.blockId !== target.blockId) {
        return annotation;
    }
    const diff = replacementLength - originalLength;
    const startsAfterTarget = annotation.anchor.start >= target.end;
    const overlapsTarget = annotation.anchor.start < target.end && annotation.anchor.end > target.start;
    if (startsAfterTarget) {
        const nextStart = annotation.anchor.start + diff;
        const nextEnd = annotation.anchor.end + diff;
        return {
            ...annotation,
            anchor: {
                ...annotation.anchor,
                start: nextStart,
                end: nextEnd,
                quote: nextText.slice(nextStart, nextEnd)
            }
        };
    }
    if (overlapsTarget) {
        const nextStart = Math.min(annotation.anchor.start, target.start);
        const nextEnd = Math.max(target.start + replacementLength, nextStart);
        return {
            ...annotation,
            anchor: {
                ...annotation.anchor,
                start: nextStart,
                end: nextEnd,
                quote: nextText.slice(nextStart, nextEnd)
            }
        };
    }
    return annotation;
}
export function createPatchProposal(document, input) {
    const block = findBlockById(document.blocks, input.blockId);
    if (!block) {
        throw new Error(`Block "${input.blockId}" was not found.`);
    }
    const blockText = getBlockPlainText(block);
    const target = {
        type: "range",
        blockId: input.blockId,
        start: input.start,
        end: input.end,
        quote: blockText.slice(input.start, input.end)
    };
    assertValidRange(blockText, target);
    return {
        patchId: createId("patch"),
        docId: input.docId,
        target,
        operation: "replace_text",
        before: blockText.slice(input.start, input.end),
        after: input.after,
        reason: input.reason,
        instruction: input.instruction,
        status: "pending",
        createdBy: input.createdBy ?? "assistant",
        createdAt: nowIso()
    };
}
export function previewPatch(document, patch) {
    const block = findBlockById(document.blocks, patch.target.blockId);
    if (!block) {
        throw new Error(`Block "${patch.target.blockId}" was not found.`);
    }
    const originalText = getBlockPlainText(block);
    assertValidRange(originalText, patch.target);
    return {
        patch,
        blockId: patch.target.blockId,
        beforeText: originalText,
        afterText: originalText.slice(0, patch.target.start) +
            patch.after +
            originalText.slice(patch.target.end),
        changedSpan: {
            start: patch.target.start,
            before: patch.before,
            after: patch.after
        }
    };
}
export function rejectPatch(patch) {
    return {
        ...patch,
        status: "rejected"
    };
}
export function applyPatch(document, patch) {
    if (document.docId !== patch.docId) {
        throw new Error("Patch docId does not match the document.");
    }
    const current = deepClone(document);
    const block = findBlockById(current.blocks, patch.target.blockId);
    if (!block) {
        throw new Error(`Block "${patch.target.blockId}" was not found.`);
    }
    const currentText = getBlockPlainText(block);
    assertValidRange(currentText, patch.target);
    const currentBefore = currentText.slice(patch.target.start, patch.target.end);
    if (currentBefore !== patch.before) {
        throw new Error(`Patch preview is stale. Expected "${patch.before}" but found "${currentBefore}".`);
    }
    const nextText = currentText.slice(0, patch.target.start) +
        patch.after +
        currentText.slice(patch.target.end);
    const nextBlocks = mapBlocks(current.blocks, patch.target.blockId, (candidate) => replaceBlockPlainText(candidate, nextText));
    const nextAnnotations = current.annotations.map((annotation) => shiftAnnotation(annotation, patch.target, patch.after.length, patch.before.length, nextText));
    return {
        ...current,
        blocks: nextBlocks,
        annotations: nextAnnotations,
        versions: [
            ...current.versions,
            createDocumentVersion(`Applied patch: ${patch.reason}`, "assistant", patch.patchId)
        ],
        metadata: {
            ...current.metadata,
            updatedAt: nowIso()
        }
    };
}
//# sourceMappingURL=patch.js.map