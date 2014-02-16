module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

/*
 TODO : sourcemaps? 
           - not sure if possible with grunt-browserify
           - if not investigate grunt-coffee-build.
*/

  grunt.initConfig({
    browserify: {
      client: {
        src: ['./client.coffee'],
        dest: 'client/client.js',
        options: {
          debug: true,
          transform: ['coffeeify']
        }
      },
      testClient: {
        src: ['./testclient.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          debug: true,
          transform: ['coffeeify']
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/util.js','test/page.js']
      }
    },

    coffee: {
      client: {
        expand: true,
        options: {
          sourceMap: true
        },
        src: ['test/*.coffee', 'lib/*.coffee'],
        ext: '.js'
      } 
    },

    watch: {
      all: {
        files: ['test/*.coffee', 'lib/*.coffee', '*.coffee'],
        tasks: ['build']
      }
    }
  });

  grunt.registerTask('build', ['coffee', 'mochaTest', 'browserify']);
  grunt.registerTask('default', ['build']);

};

