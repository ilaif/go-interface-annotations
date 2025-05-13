
import * as vscode from "vscode";

let implementDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: __dirname + "/../resources/implement.svg",
    fontWeight: "bold",
});

export function getImplementDecoration() {
    return implementDecoration;
}