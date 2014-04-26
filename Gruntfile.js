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
    clean: ['build/*', 'client/client.js', 'client/client.map', 'client/client.min.js', 'client/client.min.map', 'client/test/testclient.js'],

    browserify: {
      // build the client that we will include in the package
      productionClient: {
        src: ['./client.coffee'],
        dest: 'client/client.js',
        options: {
          extensions: ".coffee",
          transform: ['coffeeify']
        }
      },
      // build the development version of the client
      testClient: {
        src: ['./testclient.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          extensions: ".coffee",
          transform: ['coffeeify']
        }
      }
    },

    uglify: {
      production: {
        // uglify the production version, 
        //   create a map so at least if needed we can get back to the generated javascript
        options: {
          sourceMap: true,
          sourceMapName: 'client/client.map',
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
          'client/client.min.js': ['client/client.js']
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coffee-script/register'
        },
        src: ['test/util.coffee', 'test/random.coffee', 'test/page.coffee', 'test/lineup.coffee', 'test/drop.coffee', 'test/wiki.coffee']
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
  grunt.registerTask('build', ['clean', 'mochaTest', 'browserify:productionClient', 'browserify:testClient', 'uglify:production']);
  
  // the default is to do the production build.
  grunt.registerTask('default', ['build']);

};

