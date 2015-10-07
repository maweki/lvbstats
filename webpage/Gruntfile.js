module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    clean: ["dist"],
    copy: {
      main: {
        files: [
          {expand: true, src: ['*.js', '!Gruntfile.js', '.htaccess', 'style.css', 'index.html'], dest: 'dist/' }
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');


  // Default task(s).
  grunt.registerTask('default', ['dist']);
  grunt.registerTask('dist', ['clean', 'copy']);
  grunt.registerTask('minify', ['dist']);

};
