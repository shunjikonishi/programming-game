# Salesforce vs. Heroku

SalesforceとHerokuの違いをゲームを使って説明します。
ポイント＆クリックとコーディングのどちらが優れているのか？という闘いです。

## 概要
ゲームフィールド上のキャラクターを動かしてゴールドを集めます。  
ただし、キャラクターはあらかじめプログラミングしたとおりにしか動きません。  
キャラクターがフィールドの範囲外にはみ出すとゲームオーバーです。  

また、キャラクタ同士が同時に同じフィールドに入ろうとした場合、元のフィールドに押し戻されます。  
つまり、その後のプログラムは自分の意図したルートを通らなくなります。

## コマンド
キャラクター操作のコマンドは以下の４つです。

- p.up(n) 上にn歩移動(引数省略時は1)
- p.down(n) 下にn歩移動(引数省略時は1)
- p.left(n) 左にn歩移動(引数省略時は1)
- p.right(n) 右にn歩移動(引数省略時は1)

ただし、Salesforce側はボタンクリックでのコマンド入力のみ  
Heroku側はエディタでタイプする必要があります。

## 仕様
仕様書代わりのメモ

### ゲーム設定
- ゲームフィールドを再生成します。
- 歯車のアイコンを押すと設定可能な項目が表示されます。
- リセットボタンがクリックできる条件は以下
  - 自分がプレイヤーとしてエントリーしている場合
  - まだ誰もエントリーしていない場合

### ゲームスタートボタン
- ゲームを開始します
- ゲームが開始されるとコーディングフェーズとなりカウントダウンの間プレイヤーはプログラミングできます。
- コーディングフェーズが終了すると各キャラクタはプログラムに従って動きます。


## ToDo
- エントリー時のアニメーション
- 終了処理
- ゲーム開始後にページを開いた場合の対応
- 勝利数のカウント
- エラー行のハイライト
- チャットが欲しい
- READMEの整理
