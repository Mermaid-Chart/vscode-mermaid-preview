import * as vscode from "vscode";
import { aiHandler } from './aiService';

export function initializeAIChatParticipant(context: vscode.ExtensionContext): vscode.ChatParticipant {
    const tutor = vscode.chat.createChatParticipant("mermaid-ai", aiHandler);
    tutor.iconPath = vscode.Uri.joinPath(context.extensionUri, "images", "mermaid-icon.svg");
    return tutor;
} 