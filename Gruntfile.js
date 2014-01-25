module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

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
        files: ['test/*.coffee', 'lib/*.coffee'],
        tasks: ['coffee']
      }
    }
  });

  grunt.registerTask('build', ['coffee', 'browserify']);
  grunt.registerTask('default', ['build']);

};

