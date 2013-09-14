module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    coffee: {
      client: {
        expand: true,
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

  grunt.registerTask('build', ['coffee']);
  grunt.registerTask('default', ['build']);

};

