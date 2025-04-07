import { aiHandler } from "@mermaid-chart/vscode-utils";
import * as vscode from "vscode";

export function initializeAIChatParticipant(context: vscode.ExtensionContext): vscode.ChatParticipant {
    const tutor = vscode.chat.createChatParticipant("mermaid-chart", aiHandler);
    tutor.iconPath = vscode.Uri.joinPath(context.extensionUri, "images", "mermaid-icon.svg");
    return tutor;
}