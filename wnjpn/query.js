// 日本語WordnetのDBを開く
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./wnjpn.db.sqlite3');

db.serialize(function(){
    db.each("SELECT * FROM word WHERE lemma='ピラミッド'", function(err,word){
        if(err){console.log(err);}
        console.log("word:");
        console.log(word);
        db.each("SELECT * FROM sense WHERE wordid='" + word.wordid + "'", function(err, sense){
            if(err){console.log(err);}
            console.log("sense:");
            console.log(sense);
            db.each("SELECT * FROM synset WHERE synset='" + sense.synset + "'", function(err, s){
                if(err){console.log(err);}
                console.log("s:");
                console.log(s);
                db.each("SELECT word.* from sense,word where synset='" + s.synset + "' and sense.wordid=word.wordid", function(err, w){
                    if(err){console.log(err);}
                    console.log("w:");
                    console.log(w);
                });
            });
            
        });
    });
    // word
    // => { wordid: 185856, lang: 'jpn', lemma: '犬', pron: null, pos: 'n' }
    // senses
    // { synset: '10641755-n',
    //     wordid: 185856,
    //     lang: 'jpn',
    //     rank: null,
    //     lexid: null,
    //     freq: null,
    //     src: 'hand' }
    //     { synset: '02084071-n',
    //     wordid: 185856,
    //     lang: 'jpn',
    //     rank: null,
    //     lexid: null,
    //     freq: null,
    //     src: 'hand' }
});

// db.close();
