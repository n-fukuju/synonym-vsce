'use strict';

import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments, TextDocument, 
	Diagnostic, DiagnosticSeverity, InitializeResult, TextDocumentPositionParams, CompletionItem, 
	CompletionItemKind
} from 'vscode-languageserver';

// Create a connection for the server. The connection uses Node's IPC as a transport
// 接続を作成する。Node.jsのIPC（プロセス間通信）を使用している。
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
// テキストドキュメント管理のインスタンスを作成。（ドキュメント全体の同期のみサポート）
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
// リッスン開始
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
// サーバの起動後、クライアントは初期化のリクエストを送信する。
// サーバは受信したパラメータからあれこれする。
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			// サーバは、ドキュメント全体同期モード
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			// 完了を通知
			completionProvider: {
				resolveProvider: true
			},
			// Hover（マウスオーバーを提供）
			hoverProvider: true
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// ドキュメント変更イベント
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
// サーバ側の設定
interface Settings {
	lspSample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
// クライアント側の package.json ファイルで定義したサンプル設定
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
// 設定変更イベント（サーバ起動時にも発生）
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	// maxNumberOfProblems = settings.lspSample.maxNumberOfProblems || 100;
	// Revalidate any open text documents
	// 開いている各ドキュメントを再検証
	documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	// let lines = textDocument.getText().split(/\r?\n/g);
	// let problems = 0;
	// for (var i = 0; i < lines.length && problems < maxNumberOfProblems; i++) {
	// 	let line = lines[i];
	// 	let index = line.indexOf('typescript');
	// 	if (index >= 0) {
	// 		problems++;
	// 		diagnostics.push({
	// 			severity: DiagnosticSeverity.Warning,
	// 			range: {
	// 				start: { line: i, character: index },
	// 				end: { line: i, character: index + 10 }
	// 			},
	// 			message: `${line.substr(index, 10)} should be spelled TypeScript`,
	// 			source: 'ex'
	// 		});
	// 	}
	// }
	// Send the computed diagnostics to VSCode.
	// 結果をVSCodeに送信
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	// 対象ファイルの変更
	connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: 'TypeScript',
			kind: CompletionItemKind.Text,
			data: 1
		},
		{
			label: 'JavaScript',
			kind: CompletionItemKind.Text,
			data: 2
		}
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = 'TypeScript details',
			item.documentation = 'TypeScript documentation'
	} else if (item.data === 2) {
		item.detail = 'JavaScript details',
			item.documentation = 'JavaScript documentation'
	}
	return item;
});


connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	// テキストドキュメントを開いた際に発生
	// params.uri は、ドキュメントごとに一意。
	// params.text は、ドキュメントの内容全体
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	// 変更時
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	// 終了時
	connection.console.log(`${params.textDocument.uri} closed.`);
});


// Listen on the connection
connection.listen();
