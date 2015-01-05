module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // N.B. The development build includes paths in the mapfile, at the browserify step, that are not accessable
  //      from the browser.



  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // tidy-up before we start the build
    clean: ['build/*', 'client/client.js', 'client/client.map', 'client/client.*.js', 'client/client.*.map', 'client/test/testclient.js'],

    browserify: {
      // build the client that we will include in the package
      packageClient: {
        src: ['./client.coffee'],
        dest: 'client/client.max.js',
        options: {
          transform: ['coffeeify'],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      },
      // build for local development version of the client will go here (once mapfile issues are resolved)

      // build the browser testclient
      testClient: {
        src: ['./testclient.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          transform: ['coffeeify'],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      }
    },

    uglify: {
      packageClient: {
        // uglify the client version for including in the NPM package,
        //   create a map so at least if needed we can get back to the generated javascript
        //   uglified version is 'client.js', so we don't need changes elsewhere.
        options: {
          sourceMap: true,
          sourceMapName: 'client/client.map',
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
          'client/client.js': ['client/client.max.js']
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coffee-script/register'
        },
        src: [
          'test/util.coffee',
          'test/random.coffee',
          'test/page.coffee',
          'test/lineup.coffee',
          'test/drop.coffee',
          'test/revision.coffee',
          'test/resolve.coffee',
          'test/wiki.coffee'
        ]
      }
    },

    watch: {
      all: {
        files: ['test/*.coffee', 'lib/*.coffee', '*.coffee'],
        tasks: ['build']
      }
    }
  });

  // build without sourcemaps
  grunt.registerTask('build', ['clean', 'mochaTest', 'browserify:packageClient', 'browserify:testClient', 'uglify:packageClient']);

  // the default is to do the production build.
  grunt.registerTask('default', ['build']);

};
