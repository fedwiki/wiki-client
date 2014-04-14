module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-exorcise');


  grunt.initConfig({

    browserify: {
      client: {
        src: ['./client.coffee'],
        dest: 'build/client.js',
        options: {
          debug: true,
          extensions: ".coffee",
          transform: ['coffeeify']
        }
      },
      testClient: {
        src: ['./testclient.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          extensions: ".coffee",
          transform: ['coffeeify']
        }
      }
    },

    exorcise: {
      options: {
        bundleDest: 'client/client.js',
      },
      files: {
        src: ['build/client.js'],
        dest: 'client/client.map'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coffee-script/register'
        },
        src: ['test/util.coffee','test/page.coffee', 'test/lineup.coffee', 'test/drop.coffee']
      }
    },

    watch: {
      all: {
        files: ['test/*.coffee', 'lib/*.coffee', '*.coffee'],
        tasks: ['build']
      }
    }
  });

  grunt.registerTask('build', ['mochaTest', 'browserify', 'exorcise']);
  grunt.registerTask('default', ['build']);

};

