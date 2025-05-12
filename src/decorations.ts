
import * as vscode from "vscode";

let overrideDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: __dirname + "/../resources/override.svg",
    fontWeight: "bold",
});
let implementDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: __dirname + "/../resources/implement.svg",
    fontWeight: "bold",
});

export function getOverrideDecoration() {
    return overrideDecoration;
}

export function getImplementDecoration() {
    return implementDecoration;
}