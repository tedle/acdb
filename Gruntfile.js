module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dir: {
            base: 'acdb/',
            build: '<%= dir.front %>build/',
            front: '<%= dir.base %>frontend/',
            src: '<%= dir.front %>src/'
        },
        bgShell: {
            _defaults: {
                bg: true
            },
            django: {
                cmd: 'python <%= dir.base %>manage.py runserver'
            },
            migrate: {
                bg: false,
                cmd: 'python <%= dir.base %>manage.py migrate'
            }
        },
        concat: {
            javascript: {
                options: {
                    banner: '/*! <%= pkg.name %> v<%= pkg.version %>\n' + 
                            ' *  Source: <%= pkg.repository.url %>\n' +
                            ' *  License: <%= pkg.license %> */\n',
                },
                src: ['<%= dir.src %>app/app.js', '<%= dir.src %>app/**/*.js'],
                dest: '<%= dir.build %><%= pkg.name %>.js'
            }
        },
        copy: {
            migrate: {
                files: {
                    '<%= dir.base %>accf.db': '<%= dir.base %>accf.master.db'
                }
            }
        },
        cssmin: {
            build: {
                files: {
                    '<%= dir.build %>bootstrap.min.css': '<%= dir.src %>styles/bootstrap.min.css',
                    '<%= dir.build %>style.css': ['<%= dir.src %>styles/**/*.css', '!<%= dir.src %>styles/bootstrap.min.css']
                }
            }
        },
        ngtemplates: {
            acdbApp: {
                options: {
                    append: true,
                    htmlmin: {
                        collapseWhitespace: true,
                        collapseBooleanAttributes: true,
                        removeComments: true
                    }
                },
                cwd: '<%= dir.src %>app/',
                src: '**/*.html',
                dest: '<%= concat.javascript.dest %>'
            }
        },
        watch: {
            javascript: {
                files: [
                    '<%= dir.src %>app/**/*.js',
                    '<%= dir.src %>app/**/*.html',
                    '<%= dir.src %>styles/**/*.css'
                ],
                tasks: ['build']
            }
        },
        uglify: {
            options: {
                preserveComments: 'all'
            },
            build: {
                options: {
                    banner: '/*! <%= pkg.name %> v<%= pkg.version %>\n' + 
                            ' *  Source: <%= pkg.repository.url %>\n' +
                            ' *  License: <%= pkg.license %> */\n',
                    preserveComments: false
                },
                src: '<%= dir.build %><%= pkg.name %>.js',
                dest: '<%= dir.build %><%= pkg.name %>.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-bg-shell');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['build', 'uglify']);
    grunt.registerTask('build', ['concat', 'ngtemplates', 'cssmin']);
    grunt.registerTask('runserver', ['bgShell:django', 'watch']);
    grunt.registerTask('setup', ['copy:migrate', 'bgShell:migrate']);
};
