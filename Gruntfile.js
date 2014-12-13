module.exports = function(grunt) {
    'use strict';
    function loadDependencies(deps) {
        if (deps) {
            for (var key in deps) {
                if (key.indexOf("grunt-") == 0) {
                    grunt.loadNpmTasks(key);
                }
            }
        }
    }
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist : {
                src : [
                    "grunt-src/scripts/intro.txt",
                    "grunt-src/scripts/common.js",
                    "grunt-src/scripts/application.js",
                    "grunt-src/scripts/game.js",
                    "grunt-src/scripts/gameSetting.js",
                    "grunt-src/scripts/field.js",
                    "grunt-src/scripts/player.js",
                    "grunt-src/scripts/bug.js",
                    "grunt-src/scripts/salesforce.js",
                    "grunt-src/scripts/heroku.js",
                    "grunt-src/scripts/textEditor.js",
                    "grunt-src/scripts/parser.js",
                    "grunt-src/scripts/interpreter.js",
                    "grunt-src/scripts/stopWatch.js",
                    "grunt-src/scripts/animate.js",
                    "grunt-src/scripts/resultDialog.js",
                    "grunt-src/scripts/observer.js",
                    "grunt-src/scripts/outro.txt"
                ],
                dest: "public/javascripts/app.js"
            }
        },

        jshint : {
            all : ['grunt-src/scripts/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        
        watch: {
            scripts: {
                files: [
                    'grunt-src/scripts/*.js'
                ],
                tasks: ['jshint:all', 'concat'],
                options: {
                    livereload: true
                }
            }
        }
    });
 
    loadDependencies(grunt.config("pkg").devDependencies);

    grunt.registerTask('default', [ 'jshint', 'concat', 'watch']);
    grunt.registerTask('heroku', [ 'concat']);

};