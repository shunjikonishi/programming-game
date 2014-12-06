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
                    "grunt-src/scripts/player.js",
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

    grunt.registerTask('default', [ 'jshint', 'concat']);
    grunt.registerTask('heroku', [ 'concat']);

};