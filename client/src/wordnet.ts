'use strict';

import * as fs from 'fs';
import * as sql from 'sql.js';

export class WordnetJpn
{
    db:sql.Database;
    /**
     * コンストラクタ
     * @param dbfile DBファイル
     */
    public constructor(dbfile:string)
    {
        // DBファイル読み込み
        this.db = new sql.Database(fs.readFileSync(dbfile));
    }

    /**
     * 類語を取得する。
     * @param lemma 対象の語句
     * @returns SQLiteのレコード配列
     */
    public getSynonym(lemma:string)
    {
        return this.db.exec(`
            SELECT
              synset.name as synset,
              word2.lemma as lemma
            FROM word
              JOIN sense           on word.wordid = sense.wordid
              JOIN synset          on sense.synset = synset.synset
              JOIN sense as sense2 on sense.synset = sense2.synset
              JOIN word as word2   on sense2.wordid = word2.wordid
            WHERE
              word.lemma='${lemma}' and
              sense2.lang = 'jpn'
        ;`);
    }

    /**
     * 類語を取得する。
     * @param lemma（※空白文字の除去等は呼び出し側で行うこと）
     * @returns Markdownテーブル。 
     * @description DBから取得した結果を直接使用したい場合は、getSynonym を使用すること。
     */
    public getSynonymTable(lemma:string)
    {
        let results = this.getSynonym(lemma);
        // console.log(results);
        let content = `## ${lemma}\nsynset|lemma\n-|-\n`;
        if(results.length > 0)
        {
            let source:{[index:string]:string[];}={};

            for(let record of results[0].values)
            {
                let synset = record[0].toString();
                let lemma = record[1].toString();
                if(synset in source)
                {
                    source[synset].push(lemma);
                }
                else
                {
                    source[synset] = [lemma];
                }
            }
            // console.log(source);
            for(let s in source){
                content += s + '|' + source[s] + '\n';
            }
            return content;
        }
        else
        {
            content += "（候補なし）|";
            return content;
        }
    }
}
