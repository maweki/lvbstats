module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ["dist"],
    copy: {
      main: {
        files: [
          {expand: true, src: ['.htaccess'], dest: 'dist/' }
        ]
      },
      js: {
        files: [
          {expand: true, src: ['*.js', '!Gruntfile.js'], dest: 'dist/' }
        ]
      },
      css: {
        files: [
          {expand: true, src: ['style.css'], dest: 'dist/' }
        ]
      },
      html: {
        files: [
          {expand: true, src: ['index.html'], dest: 'dist/' }
        ]
      },
      fonts: {
        files: [
          {expand: true, src: ['node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.*' ], dest: 'dist/fonts/', flatten: true },
        ]
      },
      modules: {
        files: [
          {expand: true, src: ['node_modules/d3/d3.min.js'
                              , 'node_modules/jquery/dist/jquery.min.js'
                              , 'node_modules/lodash/index.js'
                              , 'node_modules/URIjs/src/URI.min.js'
                              , 'node_modules/clipboard/dist/clipboard.min.js'
                            ], dest: 'dist/' },
          {expand: true, src: ['node_modules/bootstrap/dist/css/bootstrap.min.css'
                              , 'node_modules/bootstrap/dist/css/bootstrap-theme.min.css'
                              , 'node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.*'
                              , 'submodules/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css'
                            ], dest: 'dist/' },
          {expand: true, src: ['node_modules/bootstrap/dist/js/bootstrap.min.js'
                              , 'submodules/bootstrap-datepicker/js/bootstrap-datepicker.js'
                              , 'submodules/bootstrap-datepicker/js/locales/bootstrap-datepicker.de.js'
                            ], dest: 'dist/' }
        ]
      }
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: 'dist/'
      }
    },
    usemin: {
      html: 'dist/index.html'
    },
    htmlmin: {
      options: { removeComments: true, collapseWhitespace: true,
                minifyJS: true,	minifyCSS: true },
      dist: {
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-filerev');

  grunt.loadNpmTasks('grunt-contrib-htmlmin');


  // Default task(s).
  grunt.registerTask('default', ['clean', 'dist']);
  grunt.registerTask('dist', ['copy:main', 'copy:html', 'copy:js', 'copy:css', 'copy:modules']);
  grunt.registerTask('minify', [
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'copy:html',
    'copy:main',
    'copy:fonts',
    'usemin',
    'htmlmin:dist'
  ]);

};
