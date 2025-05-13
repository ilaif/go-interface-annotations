import * as vscode from "vscode";
import { Annotation } from "./Annotation";
import { AnnotationLens } from "./AnnotationLens";
import { SymbolInfo } from "./SymbolInfo";
import { getImplementDecoration } from "./decorations";

export class AnnotationLensProvider
  implements vscode.CodeLensProvider<AnnotationLens>
{
  public async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return [];
    }

    const goSymbols = await this.getGoSymbols(document);

    const decorationLocations: vscode.Range[] = [];

    const results: AnnotationLens[] = [];
    for (const goSymbol of goSymbols) {
      const symbolInfo = await SymbolInfo.create(goSymbol);

      const locations = await this.getSymbolLocations(activeEditor, symbolInfo) ?? [];
      const symbols = await Promise.all(locations.map(SymbolInfo.getSymbol));
      if (symbols.length === 0) {
        continue;
      }

      const annotation = new Annotation(symbolInfo.symbol, symbols);
      results.push(new AnnotationLens(annotation));

      const decorationRange = new vscode.Range(
        symbolInfo.symbol.location.range.start,
        symbolInfo.symbol.location.range.start,
      );
      decorationLocations.push(
        decorationRange,
      );

      for (const child of symbolInfo.symbol.children ?? []) {
        if (child.kind !== vscode.SymbolKind.Method) {
          continue;
        }

        // For methods, get implementation locations directly
        const methodLocations = await vscode.commands.executeCommand<vscode.Location[]>(
          "vscode.executeImplementationProvider",
          activeEditor.document.uri,
          child.range.start
        ) ?? [];

        if (methodLocations.length > 0) {
          const methodSymbols = await Promise.all(methodLocations.map(SymbolInfo.getSymbol));

          // Create location from document and child range
          const location = new vscode.Location(activeEditor.document.uri, child.range);

          // Convert the child into the combined type needed for Annotation
          const combinedSymbol = {
            ...child,
            location,
            containerName: symbolInfo.symbol.name
          } as vscode.SymbolInformation & vscode.DocumentSymbol;

          const methodAnnotation = new Annotation(combinedSymbol, methodSymbols);
          results.push(new AnnotationLens(methodAnnotation));
        }
      }
    }

    activeEditor.setDecorations(
      getImplementDecoration(),
      decorationLocations,
    );


    return results;
  }

  private async getSymbolLocations(te: vscode.TextEditor, si: SymbolInfo): Promise<vscode.Location[]> {
    let position = si.symbol.location.range.start;
    if (si.symbol.kind === vscode.SymbolKind.Method) {
      position = new vscode.Position(
        si.symbol.selectionRange.start.line,
        si.symbol.selectionRange.start.character + 1,
      );
    }
    return vscode.commands.executeCommand<vscode.Location[]>(
      "vscode.executeImplementationProvider",
      te.document.uri,
      position,
    );
  }

  private async getGoSymbols(document: vscode.TextDocument) {
    const symbols = (await vscode.commands.executeCommand<
      (vscode.SymbolInformation & vscode.DocumentSymbol)[]
    >("vscode.executeDocumentSymbolProvider", document.uri))!.filter(
      (symbol) =>
        symbol.kind === vscode.SymbolKind.Class ||
        symbol.kind === vscode.SymbolKind.Struct ||
        symbol.kind === vscode.SymbolKind.Interface ||
        symbol.kind === vscode.SymbolKind.Method
    );
    return symbols;
  }
}
