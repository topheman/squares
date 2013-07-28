/*!
 * TophemanSquares
 * http://squares.topheman.com/
 *
 * Copyright 2012, Christophe Rosset (Topheman)
 * http://blog.topheman.com/
 * http://twitter.com/topheman
 *
 * TophemanSquares.js
 * Game wrapper
 * 
 * @dependency Array.foreachLoopBack.js
 * @dependency Dot.js
 * @dependency GameManager.js
 * @dependency HighScoresManager.js
 * @dependency HotKeys.js
 * @dependency Prop.js
 * @dependency Shape.js
 * @dependency jquery-1.7.1.js (any version of jQuery)
 */

var TophemanSquares = (function(){

    var game;

    return {

        init : function(){
            console.info('init');
            var canvas = document.getElementById("topheman-squares");
            game = new GameManager(canvas);
            game.init();

        },
        loop : function(){
            game.loop();
        }

    }

})()