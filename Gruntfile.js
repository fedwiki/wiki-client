module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-git-authors');

  // N.B. The development build includes paths in the mapfile, at the browserify step, that are not accessable
  //      from the browser.



  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    authors: {
      prior: [
        "Ward Cunningham <ward@c2.com>",
        "Stephen Judkins <stephen.judkins@gmail.com>",
        "Sam Goldstein <sam@aboutus.org>",
        "Steven Black <steveb@stevenblack.com>",
        "Don Park <don@donpark.org>",
        "Sven Dowideit <SvenDowideit@fosiki.com>",
        "Adam Solove <asolove@gmail.com>",
        "Nick Niemeir <nick.niemeir@gmail.com>",
        "Erkan Yilmaz <erkan77@gmail.com>",
        "Matt Niemeir <matt.niemeir@gmail.com>",
        "Daan van Berkel <daan.v.berkel.1980@gmail.com>",
        "Nicholas Hallahan <nick@theoutpost.io>",
        "Ola Bini <ola.bini@gmail.com>",
        "Danilo Sato <dtsato@gmail.com>",
        "Henning Schumann <henning.schumann@gmail.com>",
        "Michael Deardeuff <michael.deardeuff@gmail.com>",
        "Pete Hodgson <git@thepete.net>",
        "Marcin Cieslak <saper@saper.info>",
        "M. Kelley Harris (http://www.kelleyharris.com)",
        "Ryan Bennett <nomad.ry@gmail.com>",
        "Paul Rodwell <paul.rodwell@btinternet.com>",
        "David Turnbull <dturnbull@gmail.com>",
        "Austin King <shout@ozten.com>"
      ]
    },

    // tidy-up before we start the build
    clean: ['build/*', 'client/client.cjs', 'client/client.map', 'client/client.*.cjs', 'client/client.*.map', 'client/test/testclient.cjs'],

    browserify: {
      // build the client that we will include in the package
      packageClient: {
        src: ['./client.cjs'],
        dest: 'client/client.max.js'
      },
      // build for local development version of the client will go here (once mapfile issues are resolved)

      // build the browser testclient
      testClient: {
        src: ['./testclient.cjs'],
        dest: 'client/test/testclient.cjs'
      }
    },

    uglify: {
      packageClient: {
        // uglify the client version for including in the NPM package,
        //   create a map so at least if needed we can get back to the generated javascript
        //   uglified version is 'client.cjs', so we don't need changes elsewhere.
        options: {
          sourceMap: true,
          sourceMapRoot: "/",
          sourceMapName: 'client/client.map',
          banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                  ' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> and other contributors;\n' +
                  ' * Released under the <%= pkg.license %> license */',
        },
        files: {
          'client/client.cjs': ['client/client.max.cjs']
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [
          'test/util.js',
          'test/random.js',
          'test/page.js',
          'test/lineup.js',
          'test/drop.js',
          'test/revision.js',
          'test/resolve.js',
          'test/wiki.js'
        ]
      }
    },

    watch: {
      all: {
        files: ['test/*.js', 'lib/*.js', '*.js'],
        tasks: ['build']
      }
    }
  });

  // build without sourcemaps
  grunt.registerTask('build', ['clean', 'mochaTest', 'browserify:packageClient', 'browserify:testClient', 'uglify:packageClient']);

  // check for out-of-date libraries and known vulnerabilities

  grunt.registerTask('check', ['retire']);


  // the default is to do the production build.
  grunt.registerTask('default', ['build']);

};
