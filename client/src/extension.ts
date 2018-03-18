'use strict';

import * as path from 'path';

import vscode = require('vscode');
import { workspace, ExtensionContext, Hover } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { CancellationToken } from 'vscode-jsonrpc/lib/cancellation';
import { WordnetJpn } from './wordnet';

export function activate(context: ExtensionContext) {

	// サーバ側が事前にコンパイル済みであること。
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// サーバ側のデバッグオプションを指定
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
	
	// 拡張がデバッグモードで起動された場合、デバッグオプションが使用される。
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}
	
	// クライアント用オプション
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{scheme: 'file', language: 'plaintext'},
			{scheme: 'file', language: 'markdown'}
		],
		synchronize: {
			// 拡張の設定を、サーバ側と同期させる。
			configurationSection: 'lspSample',
			// ファイルの変更を、サーバに通知する。
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	}
	
	// 言語クライアントの作成と起動
	let disposable = new LanguageClient('lspSample', 'Language Server Example', serverOptions, clientOptions).start();
	
	// disposable をサブスクリプションに追加しておくことで、拡張機能の停止時にクライアントが非アクティブ化できるようにする。
	context.subscriptions.push(disposable);

	// ワードネットのDBファイル
	let dbfile = context.asAbsolutePath(path.join('db','wnjpn.db.sqlite3'));
	// Hoverを登録
	context.subscriptions.push(
		vscode.languages.registerHoverProvider({scheme: "file"}, new HoverProvider(dbfile))
	);
}

// Hover の実装
class HoverProvider implements HoverProvider{
	public constructor(private dbfile:string){}
	// （使用しない引数に、"_" を付けておく）
	public provideHover(_document: vscode.TextDocument, position: vscode.Position, _token: CancellationToken): Thenable<Hover>
	{
		let editor = vscode.window.activeTextEditor;
		let start = editor.document.offsetAt(editor.selection.start);
		let end = editor.document.offsetAt(editor.selection.end);
		let pos = editor.document.offsetAt(position);
		// 選択範囲にマウスオーバーしていれば処理する
		if(pos >= start && end >= pos){
			// 選択範囲を取得
			let text = editor.document.getText();
			let selected = text.slice(start, end).trim();
			// console.debug(" HoverProvider.provideHover() ");

			// DBから取得したテキストをHoverにセットして返す
			return new Promise<Hover>((resolve)=>{
				(async()=>{
					let w = new WordnetJpn(this.dbfile);
					let markdownText = w.getSynonymTable(selected);
					let hover = new Hover(markdownText);
					return resolve(hover);
				})();
			})
		}else{
			console.debug("out of selection.")
			return new Promise<Hover>((resolve)=>{
				return resolve(new Hover(""));
			});
		}
	}
}
